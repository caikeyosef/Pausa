import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ENVIRONMENT_CHECKLIST } from '../data/pausaContent';
import { calculateEnvironmentProgress } from '../utils/pausaLogic';

interface EnvironmentTabProps {
  checkedIds: string[];
  onToggleItem: (id: string) => void;
}

export function EnvironmentTab({ checkedIds, onToggleItem }: EnvironmentTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const progress = calculateEnvironmentProgress(checkedIds);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2B2D2B]">
          Ambiente Digital
        </h1>
        <p className="text-sm text-[#6B6F6C] mt-1 max-w-2xl">
          Pequenos ajustes no seu aparelho reduzem a tentação automaticamente — sem
          depender apenas de força de vontade.
        </p>
      </div>

      {/* Top Progress Bar: Blindagem do Ambiente */}
      <section className="bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="text-base font-semibold text-[#2B2D2B]">
            Blindagem do Ambiente
          </h2>
          <span
            data-testid="environment-progress-text"
            className="text-sm text-[#6B6F6C] tabular-nums"
          >
            <strong className="font-semibold text-[#6A8D73]">
              {progress.completed} de {progress.total}
            </strong>{' '}
            ajustes ativos · {progress.percentage}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progress.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da Blindagem do Ambiente"
          className="h-2.5 w-full rounded-full bg-[#F0EDE6] overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-[#6A8D73] transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        <p className="text-xs text-[#6B6F6C] mt-3">
          {progress.completed === progress.total
            ? 'Seu ambiente está configurado para favorecer a calma e a atenção.'
            : 'Escolha um ajuste por vez. Mesmo duas mudanças já diminuem bastante os acessos por reflexo.'}
        </p>
      </section>

      {/* Interactive Checklist */}
      <div className="space-y-3">
        {ENVIRONMENT_CHECKLIST.map((item) => {
          const isChecked = checkedIds.includes(item.id);
          const isExpanded = expandedId === item.id;

          return (
            <article
              key={item.id}
              className="bg-white border border-[#E5E2DC] rounded-2xl p-4 sm:p-5 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  aria-label={item.title}
                  onClick={() => onToggleItem(item.id)}
                  className="min-h-[44px] min-w-[44px] -ml-2 -mt-1.5 flex items-center justify-center shrink-0 rounded-xl hover:bg-[#F6F4EF] transition-colors"
                >
                  <span
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-[#6A8D73] border-[#6A8D73] text-white'
                        : 'bg-[#FAF9F6] border-[#C9C4BA] text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4" strokeWidth={2.2} />
                  </span>
                </button>

                <div className="flex-1 min-w-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    className={`text-left text-[15px] leading-snug font-medium transition-colors ${
                      isChecked ? 'text-[#6B6F6C] line-through' : 'text-[#2B2D2B]'
                    }`}
                  >
                    {item.title}
                  </button>

                  <div className="mt-2">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedId((current) =>
                          current === item.id ? null : item.id
                        )
                      }
                      className="min-h-[36px] inline-flex items-center gap-1 text-xs font-medium text-[#6A8D73] hover:text-[#587860] transition-colors"
                    >
                      <span>Por que funciona?</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.8} />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.8} />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 pt-3 border-t border-[#E5E2DC] space-y-1">
                      <p className="text-xs font-semibold text-[#2B2D2B]">
                        {item.whyTitle}
                      </p>
                      <p className="text-xs sm:text-sm text-[#6B6F6C] leading-relaxed">
                        {item.whyBody}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
