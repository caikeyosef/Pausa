import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface PatternAnalysisRequest {
  profile: {
    dominantTitle: string;
    dailyGoalMinutes: number;
    dimensions: Array<{ label: string; score: number }>;
  } | null;
  journalSummary: {
    totalEntries: number;
    topTriggers: Array<{ label: string; count: number; percentage: number }>;
    periodDistribution: Array<{ label: string; count: number }>;
    isBedtimeConcentrated: boolean;
    recentReflections: Array<{
      trigger: string;
      period: string;
      needNote?: string;
    }>;
  };
  environmentCompleted: number;
  environmentTotal: number;
  pausesWonToday: number;
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/analyze-patterns', async (req, res) => {
    const body = req.body as PatternAnalysisRequest | undefined;
    if (!body || !body.journalSummary) {
      res.status(400).json({ error: 'Dados do diário ausentes para análise.' });
      return;
    }

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'A chave da API Gemini não está configurada neste ambiente. Configure GEMINI_API_KEY em Settings > Secrets para ativar a análise personalizada.',
      });
      return;
    }

    try {
      const profileContext = body.profile
        ? `Perfil dominante: ${body.profile.dominantTitle}. Meta diária realista: ${body.profile.dailyGoalMinutes} min/dia. Dimensões (1 a 5): ${body.profile.dimensions
            .map((d) => `${d.label}: ${d.score}/5`)
            .join(', ')}.`
        : 'Perfil digital ainda não mapeado.';

      const triggersText =
        body.journalSummary.topTriggers.length > 0
          ? body.journalSummary.topTriggers
              .map((t) => `${t.label} (${t.count}x, ${t.percentage}%)`)
              .join(', ')
          : 'Nenhum gatilho registrado ainda.';

      const periodsText = body.journalSummary.periodDistribution
        .map((p) => `${p.label}: ${p.count}`)
        .join(', ');

      const reflectionsText = body.journalSummary.recentReflections
        .slice(0, 10)
        .map(
          (r) =>
            `- [${r.period}] Gatilho: ${r.trigger}${
              r.needNote ? ` | O que realmente precisava: "${r.needNote}"` : ''
            }`
        )
        .join('\n');

      const prompt = `Analise com acolhimento os dados abaixo de uma pessoa usando o app "Pausa." de bem-estar digital baseado em evidências (TCC e redução sustentável de 30 a 60 min/dia, nunca abstinência punitiva).

${profileContext}
Total de registros no diário: ${body.journalSummary.totalEntries}
Principais gatilhos: ${triggersText}
Distribuição por período: ${periodsText}
Concentração antes de dormir: ${body.journalSummary.isBedtimeConcentrated ? 'Sim' : 'Não'}
Checklist de ambiente: ${body.environmentCompleted}/${body.environmentTotal} ajustes ativos
Pausas vencidas hoje: ${body.pausesWonToday}

Registros recentes:
${reflectionsText || 'Sem anotações detalhadas.'}

Retorne um JSON estruturado em português do Brasil, conciso, empático, sem culpa ou julgamento, com:
- summary: 1 parágrafo curto (2 frases no máximo) acolhendo o padrão observado.
- recommendations: exatamente 3 recomendações práticas e gentis (cada uma com title curto e action direta de 1 a 2 frases) conectadas aos gatilhos, períodos e ajustes do usuário.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é um especialista em psicologia comportamental e saúde digital (TCC). Seu tom é calmo, humano, livre de culpa e direto. Nunca recomende abstinência radical, nunca use tom alarmista e mantenha cada texto breve e fácil de ler no celular.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Resumo curto e empático dos padrões observados (máx. 2 frases).',
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Título curto e claro da recomendação.',
                    },
                    action: {
                      type: Type.STRING,
                      description: 'Passo prático e gentil de 1 a 2 frases.',
                    },
                  },
                  required: ['title', 'action'],
                },
                description: 'Lista de 2 a 3 recomendações práticas sem julgamento.',
              },
            },
            required: ['summary', 'recommendations'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'Não foi possível interpretar a análise retornada. Tente novamente em instantes.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        summary: string;
        recommendations: Array<{ title: string; action: string }>;
      };

      res.json({
        summary: parsed.summary,
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.slice(0, 3)
          : [],
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro desconhecido ao consultar o serviço.';
      const status =
        message.includes('403') || message.includes('API_KEY_INVALID')
          ? 403
          : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 500;
      res.status(status).json({
        error:
          status === 403
            ? 'Verifique a chave da API Gemini em Settings > Secrets.'
            : status === 429
              ? 'Limite de requisições atingido temporariamente. Tente novamente em alguns instantes.'
              : 'Não foi possível concluir a análise agora. Tente novamente em alguns instantes.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pausa. server listening on http://localhost:${PORT}`);
  });
}

startServer();
