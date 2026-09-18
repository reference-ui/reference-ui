import type * as React from 'react';
import { createRoot } from '@reference-ui/react';

interface PageModule {
  Page: () => React.JSX.Element;
  meta: { title: string; blurb: string };
}

interface PageDef extends PageModule {
  route: string;
}

// Auto-discovered: every file in pages/ is a route named by its filename.
// A page exports `meta` (menu title + blurb) and `Page` (the content) —
// adding a route is adding one file, nothing else to touch.
const modules = import.meta.glob<PageModule>('./pages/*.tsx', { eager: true });
const PAGES: PageDef[] = Object.entries(modules)
  .map(([file, mod]) => ({ ...mod, route: file.replace(/^\.\/pages\//, '').replace(/\.tsx$/, '') }))
  .sort((a, b) => (a.route < b.route ? -1 : 1));

// Palette is lib's gray ramp verbatim (oklch); the accent is our brand violet.
const G50 = 'oklch(98.5% 0.002 247.839)';
const G100 = 'oklch(96.7% 0.003 264.542)';
const G200 = 'oklch(92.8% 0.006 264.531)';
const G300 = 'oklch(87.2% 0.01 258.338)';
const G400 = 'oklch(70.7% 0.022 261.325)';
const G600 = 'oklch(44.6% 0.03 256.802)';
const G700 = 'oklch(37.3% 0.034 259.733)';
const G800 = 'oklch(27.8% 0.033 256.848)';
const G900 = 'oklch(21% 0.034 264.665)';
const G950 = 'oklch(13% 0.028 261.692)';
const ACCENT = '#8b5cf6';
const FONT = 'system-ui, -apple-system, sans-serif';
const MONO = 'ui-monospace, monospace';

// No hooks: the generated react entry exports createRoot but no useState, and
// importing hooks from 'react' would mount a second React copy. Module state
// plus an explicit render() is all a menu shell needs.
type Theme = 'dark' | 'light';

function defaultRoute(): string {
  return PAGES.some((p) => p.route === 'kitchen') ? 'kitchen' : (PAGES[0] !== undefined ? PAGES[0].route : '');
}

function currentRoute(): string {
  return window.location.hash.replace(/^#\/?/, '') || defaultRoute();
}

function initialTheme(): Theme {
  return new URLSearchParams(window.location.search).get('theme') === 'light' ? 'light' : 'dark';
}

let theme: Theme = initialTheme();
let search = '';

function applyTheme(next: Theme): void {
  theme = next;
  document.documentElement.setAttribute('data-color-mode', theme);
  document.body.style.colorScheme = theme;
  const url = new URL(window.location.href);
  url.searchParams.set('theme', theme);
  window.history.replaceState({}, '', url.toString());
}

function Shell({ page }: { page: PageDef }): React.JSX.Element {
  const Content = page.Page;
  const isDark = theme === 'dark';
  const q = search.trim().toLowerCase();
  const visible = q
    ? PAGES.filter((p) => p.meta.title.toLowerCase().includes(q) || p.route.includes(q))
    : PAGES;

  const border = isDark ? G800 : G200;
  const textBase = isDark ? G50 : G950;
  const textLight = isDark ? G300 : G700;
  const textLighter = isDark ? G400 : G600;
  const sidebarBg = isDark ? G950 : G50;
  const canvasBg = isDark ? G950 : G100;
  const topbarBg = isDark ? G950 : '#ffffff';
  const hoverBg = isDark ? G900 : G100;
  const selectedBg = isDark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(124, 58, 237, 0.1)';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: FONT }}>
      <aside
        style={{
          width: '248px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${border}`,
          backgroundColor: sidebarBg,
          zIndex: 10,
        }}
      >
        <header
          style={{
            height: '48px',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: textBase,
                whiteSpace: 'nowrap',
              }}
            >
              Neo playground
            </span>
            <span
              style={{
                fontSize: '9px',
                padding: '1px 6px',
                borderRadius: '6px',
                backgroundColor: selectedBg,
                color: ACCENT,
                fontWeight: 600,
              }}
            >
              neo
            </span>
          </div>
          <div
            role="group"
            aria-label="Colour mode"
            style={{
              display: 'flex',
              borderRadius: '8px',
              border: `1px solid ${border}`,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {(['dark', 'light'] as Theme[]).map((t) => {
              const active = theme === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (theme !== t) {
                      applyTheme(t);
                      render();
                    }
                  }}
                  aria-pressed={active}
                  title={`Switch to ${t} theme`}
                  style={{
                    padding: '5px 9px',
                    border: 'none',
                    cursor: active ? 'default' : 'pointer',
                    backgroundColor: active ? selectedBg : 'transparent',
                    color: active ? textBase : textLighter,
                    fontSize: '10px',
                    fontWeight: active ? 700 : 500,
                    fontFamily: FONT,
                    textTransform: 'capitalize',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {t === 'dark' ? 'Dark' : 'Light'}
                </button>
              );
            })}
          </div>
        </header>

        <div style={{ padding: '12px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <input
            id="pg-search"
            type="search"
            placeholder="Search worlds... (/)"
            defaultValue={search}
            onInput={(e) => {
              search = (e.target as HTMLInputElement).value;
              render();
              const input = document.getElementById('pg-search');
              if (input instanceof HTMLInputElement) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
              }
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = ACCENT;
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = isDark ? G800 : G300;
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 10px',
              fontSize: '11px',
              fontFamily: FONT,
              borderRadius: '6px',
              border: `1px solid ${isDark ? G800 : G300}`,
              backgroundColor: isDark ? G900 : '#ffffff',
              color: textBase,
              outline: 'none',
            }}
          />
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: textLighter,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 10px',
            }}
          >
            Worlds · {PAGES.length}
          </span>
          {visible.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: textLight, fontSize: '11px' }}>
              No worlds match &ldquo;{search}&rdquo;
            </div>
          ) : (
            visible.map((p) => {
              const selected = p.route === page.route;
              return (
                <a
                  key={p.route}
                  href={`#/${p.route}`}
                  title={p.meta.blurb}
                  style={{
                    display: 'block',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    backgroundColor: selected ? selectedBg : 'transparent',
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ display: 'block', fontSize: '11px', color: selected ? textBase : textLight, fontWeight: selected ? 600 : 500 }}>
                    {p.meta.title}
                  </span>
                  <span style={{ display: 'block', fontSize: '10px', color: textLighter, marginTop: '1px' }}>
                    {p.meta.blurb}
                  </span>
                </a>
              );
            })
          )}
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: canvasBg }}>
        <header
          style={{
            height: '48px',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${border}`,
            boxShadow: isDark ? '0 1px 0 rgba(139, 92, 246, 0.25)' : 'none',
            backgroundColor: topbarBg,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
            <span style={{ fontSize: '13px', color: textLight }}>Worlds</span>
            <span style={{ fontSize: '13px', color: textLighter }}>/</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: textBase, whiteSpace: 'nowrap' }}>{page.meta.title}</span>
            <span style={{ fontSize: '11px', color: textLighter, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {page.meta.blurb}
            </span>
          </div>
          <span style={{ fontSize: '11px', fontFamily: MONO, color: textLighter }}>
            #/{page.route} · {theme}
          </span>
        </header>

        <main style={{ flex: 1, overflow: 'auto', backgroundColor: canvasBg, color: textBase }}>
          <div style={{ padding: '24px 32px' }}>
            <Content />
          </div>
        </main>
      </div>
    </div>
  );
}

function render(): void {
  const route = currentRoute();
  const page = PAGES.find((p) => p.route === route) ?? PAGES.find((p) => p.route === defaultRoute()) ?? PAGES[0];
  if (!page) return;
  root.render(<Shell page={page} />);
}

const mount = document.getElementById('root');
if (!mount) throw new Error('missing #root');
const root = createRoot(mount);

document.body.style.margin = '0';
applyTheme(theme);
window.addEventListener('hashchange', render);
window.addEventListener('keydown', (e) => {
  const input = document.getElementById('pg-search');
  if (e.key === '/' && document.activeElement !== input) {
    e.preventDefault();
    if (input instanceof HTMLInputElement) input.focus();
  } else if (e.key === 'Escape' && document.activeElement === input) {
    search = '';
    render();
    if (input instanceof HTMLInputElement) input.blur();
  }
});
render();
