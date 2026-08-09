import React, { useEffect, useState } from 'react';

const TABS = [
  { id: 'studio', label: 'Studio' },
  { id: 'models', label: 'Models' },
  { id: 'converter', label: 'Converter' },
];

const MODES = [
  { id: 'simple', label: 'Simple' },
  { id: 'studio', label: 'Studio' },
  { id: 'advanced', label: 'Advanced' },
];

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('badlovoice_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('badlovoice_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  return (
    <button
      type="button"
      className="mode-toggle"
      title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
      aria-label="Toggle theme"
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
    >
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  );
}

const LAYOUT_KEY = 'badlovoice_layout_v2';

function isNativeApp() {
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

function readLayout() {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved === 'phone' || saved === 'desktop' || saved === 'auto') return saved;
    // Drop stuck v1 "desktop" so the APK opens in phone mode.
    localStorage.removeItem('badlovoice_layout');
  } catch {
    // ignore
  }
  // Native / narrow: phone. Wide browser: responsive (auto).
  if (isNativeApp()) return 'phone';
  try {
    if (window.matchMedia('(min-width: 1024px)').matches) return 'auto';
  } catch {
    // ignore
  }
  return 'phone';
}

function lockPhoneScroll() {
  window.scrollTo(0, window.scrollY || 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  const root = document.getElementById('root');
  if (root) root.scrollLeft = 0;
}

/** Phone = stacked (no pan). Desktop = wide 3-col (swipe sideways). */
function LayoutToggle() {
  const [layout, setLayout] = useState(readLayout);

  useEffect(() => {
    document.documentElement.setAttribute('data-layout', layout);
    try {
      localStorage.setItem(LAYOUT_KEY, layout);
      localStorage.removeItem('badlovoice_layout');
    } catch {
      // ignore
    }
    if (layout !== 'desktop') {
      lockPhoneScroll();
      requestAnimationFrame(lockPhoneScroll);
    }
  }, [layout]);

  // Native app: never keep "auto" (can look wide in WebView).
  useEffect(() => {
    if (isNativeApp() && layout === 'auto') {
      setLayout('phone');
    }
  }, [layout]);

  const desktop = layout === 'desktop';
  return (
    <button
      type="button"
      className={`mode-toggle ${desktop ? 'mode-toggle-on' : ''}`}
      title={desktop ? 'Back to phone layout (no sideways scroll)' : 'Wide desktop layout (swipe sideways)'}
      aria-label={desktop ? 'Switch to phone layout' : 'Switch to desktop layout'}
      aria-pressed={desktop}
      onClick={() =>
        setLayout((v) => (v === 'desktop' ? (isNativeApp() ? 'phone' : 'auto') : 'desktop'))
      }
    >
      {desktop ? 'Phone' : 'Desktop'}
    </button>
  );
}

export default function Layout({
  children,
  tab,
  onTabChange,
  statusSlot = null,
  headerActions = null,
  density = 'studio',
  onDensityChange = null,
  isLive = false,
}) {
  return (
    <div className="badlovoice min-h-screen text-[color:var(--ink-text)]">
      <div className="grain" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:var(--surface)]/92 backdrop-blur-xl">
          <div className="shell-header mx-auto flex w-full max-w-[1560px] flex-wrap items-center gap-3 pb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src="/brand-mark-app.png"
                alt=""
                width={36}
                height={36}
                className="brand-mark shrink-0"
                draggable={false}
              />
              <div className="min-w-0 leading-tight">
                <p className="font-display truncate text-xl font-bold tracking-[-0.03em]">
                  BadloVoice
                </p>
                <p className="truncate text-xs text-[color:var(--muted)]">
                  Voice studio
                </p>
              </div>
            </div>

            <nav className="flex min-w-0 flex-1 justify-center gap-1">
              {TABS.map((item) => {
                const selected = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange?.(item.id)}
                    aria-current={selected ? 'page' : undefined}
                    className={`min-h-10 rounded-xl px-3.5 text-sm font-semibold transition ${
                      selected
                        ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-soft)]'
                        : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]/60 hover:text-[color:var(--ink-text)]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <span
                className={`status-pill ${isLive ? 'status-pill-live' : 'status-pill-off'}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLive ? 'bg-[color:var(--accent)] rec-blink' : 'bg-[color:var(--ink-text)]/25'
                  }`}
                />
                {isLive ? 'LIVE' : 'Idle'}
              </span>
              {statusSlot}
              {onDensityChange && (
                <div className="flex rounded-xl border border-[color:var(--line)] p-0.5">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onDensityChange(m.id)}
                      className={`min-h-9 rounded-lg px-2.5 text-xs font-semibold transition ${
                        density === m.id
                          ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-soft)]'
                          : 'text-[color:var(--muted)] hover:text-[color:var(--ink-text)]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
              <LayoutToggle />
              <ThemeToggle />
              {headerActions}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="shell-main mx-auto w-full max-w-[1560px] py-4 sm:py-5">
            {children}
          </div>
        </main>

        <footer className="shell-footer border-t border-[color:var(--line)] pt-3">
          <p className="mx-auto w-full max-w-[1560px] text-center text-xs text-[color:var(--muted)] sm:text-left">
            BadloVoice
            <span className="mx-1.5 text-[color:var(--ink-text)]/25" aria-hidden="true">
              ·
            </span>
            Built by Abuzar
          </p>
        </footer>
      </div>
    </div>
  );
}
