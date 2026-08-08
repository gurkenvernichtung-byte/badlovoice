import React from 'react';

const PRO_TABS = [
  { id: 'studio', label: 'Studio' },
  { id: 'models', label: 'Models' },
  { id: 'converter', label: 'Converter' },
];

export default function Layout({
  children,
  tab,
  onTabChange,
  statusSlot = null,
  headerActions = null,
  uiMode = 'simple',
  onUiModeChange = null,
}) {
  const isPro = uiMode === 'pro';

  return (
    <div className="badlovoice min-h-screen text-[color:var(--ink-text)]">
      <div className="grain" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#121018]/88 backdrop-blur-xl">
          <div className="shell-header mx-auto flex w-full max-w-lg items-center gap-3 pb-3.5 sm:max-w-[1560px]">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="brand-mark shrink-0" aria-hidden="true" />
              <div className="min-w-0 leading-tight">
                <p className="font-display truncate text-xl font-bold tracking-[-0.03em] text-[color:var(--ink-text)]">
                  BadloVoice
                </p>
                <p className="truncate text-xs text-[color:var(--muted)]">
                  Change your voice live
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {onUiModeChange && (
                <button
                  type="button"
                  onClick={() => onUiModeChange(isPro ? 'simple' : 'pro')}
                  className={`mode-toggle ${isPro ? 'mode-toggle-on' : ''}`}
                  aria-pressed={isPro}
                  title={isPro ? 'Simple home' : 'Pro studio'}
                >
                  {isPro ? 'Simple' : 'Pro'}
                </button>
              )}
              {isPro ? statusSlot : null}
              {headerActions}
            </div>
          </div>

          {isPro && (
            <nav className="shell-main mx-auto flex w-full max-w-lg gap-1 pb-3 sm:max-w-[1560px]">
              {PRO_TABS.map((item) => {
                const selected = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange?.(item.id)}
                    aria-current={selected ? 'page' : undefined}
                    className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition ${
                      selected
                        ? 'bg-[color:var(--accent)]/18 text-[color:var(--accent-soft)]'
                        : 'bg-white/[0.03] text-[color:var(--muted)] hover:text-[color:var(--ink-text)]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        <main className="flex-1">
          <div
            className={`shell-main mx-auto w-full py-5 ${
              isPro ? 'max-w-[1560px]' : 'max-w-lg'
            }`}
          >
            {children}
          </div>
        </main>

        <footer className="shell-footer border-t border-white/[0.06] pt-3">
          <p className="mx-auto w-full max-w-lg text-center text-xs text-[color:var(--muted)] sm:max-w-[1560px] sm:text-left">
            {isPro ? 'BadloVoice Studio' : 'BadloVoice'}
          </p>
        </footer>
      </div>
    </div>
  );
}
