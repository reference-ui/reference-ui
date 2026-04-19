import * as React from 'react'
import { createRoot } from 'react-dom/client'
import * as IconModule from './index'

type IconProps = {
  size?: string | number
  variant?: 'outline' | 'filled'
  [key: string]: unknown
}

type IconComponent = React.ComponentType<IconProps>

const iconEntries = Object.entries(IconModule)
  .filter(([name, value]) => name.endsWith('Icon') && (typeof value === 'function' || typeof value === 'object'))
  .map(([name, value]) => [name, value as IconComponent] as const)
  .sort(([a], [b]) => a.localeCompare(b))

const MAX_INITIAL = 180

function App() {
  const [query, setQuery] = React.useState('')
  const [variant, setVariant] = React.useState<'outline' | 'filled'>('outline')

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return iconEntries
    return iconEntries.filter(([name]) => name.toLowerCase().includes(normalized))
  }, [query])

  const visible = React.useMemo(() => {
    if (query.trim()) return filtered
    return filtered.slice(0, MAX_INITIAL)
  }, [filtered, query])

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <div style={styles.eyebrow}>Reference UI</div>
          <h1 style={styles.title}>Icon Island</h1>
          <p style={styles.copy}>
            Local preview for <code>@reference-ui/icons</code>. This stays inside the package and does not depend on
            <code> reference-lib </code> or <code> reference-docs </code>.
          </p>
        </div>

        <div style={styles.controls}>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search icons"
            aria-label="Search icons"
            style={styles.search}
          />
          <div style={styles.toggleWrap}>
            <button
              type="button"
              onClick={() => setVariant('outline')}
              style={variant === 'outline' ? { ...styles.toggle, ...styles.toggleActive } : styles.toggle}
            >
              Outline
            </button>
            <button
              type="button"
              onClick={() => setVariant('filled')}
              style={variant === 'filled' ? { ...styles.toggle, ...styles.toggleActive } : styles.toggle}
            >
              Filled
            </button>
          </div>
        </div>
      </div>

      <div style={styles.metaRow}>
        <span>
          Showing {visible.length} of {filtered.length}
          {!query.trim() && filtered.length > MAX_INITIAL ? `, capped to ${MAX_INITIAL} until you search` : ''}
        </span>
        <span>{iconEntries.length} total icons loaded</span>
      </div>

      <div style={styles.grid}>
        {visible.map(([name, Icon]) => (
          <div key={name} style={styles.card} title={name}>
            <div style={styles.iconFrame}>
              <Icon size={28} variant={variant} aria-hidden="true" />
            </div>
            <div style={styles.label}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    padding: '32px',
    background:
      'radial-gradient(circle at top left, rgba(255, 196, 92, 0.28), transparent 28%), linear-gradient(180deg, #f7f2ea 0%, #efe6da 100%)',
    color: '#1f1c18',
    fontFamily: 'Georgia, Iowan Old Style, serif',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 0.9fr)',
    gap: '24px',
    alignItems: 'end',
    marginBottom: '24px',
  },
  eyebrow: {
    fontSize: '12px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#7c5f3a',
    marginBottom: '8px',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(42px, 7vw, 76px)',
    lineHeight: 0.94,
    letterSpacing: '-0.04em',
  },
  copy: {
    maxWidth: '58ch',
    fontSize: '16px',
    lineHeight: 1.6,
    color: '#4c4337',
    marginTop: '12px',
    marginBottom: 0,
  },
  controls: {
    display: 'grid',
    gap: '12px',
    padding: '16px',
    border: '1px solid rgba(61, 49, 33, 0.12)',
    borderRadius: '22px',
    background: 'rgba(255, 250, 243, 0.78)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 18px 40px rgba(73, 57, 33, 0.08)',
  },
  search: {
    width: '100%',
    border: '1px solid rgba(61, 49, 33, 0.16)',
    borderRadius: '999px',
    padding: '12px 16px',
    fontSize: '15px',
    background: '#fffdf8',
    color: '#1f1c18',
    outline: 'none',
  },
  toggleWrap: {
    display: 'flex',
    gap: '8px',
  },
  toggle: {
    flex: 1,
    border: '1px solid rgba(61, 49, 33, 0.12)',
    borderRadius: '999px',
    background: '#f4ede2',
    color: '#4a3d2d',
    padding: '10px 12px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  toggleActive: {
    background: '#1f1c18',
    color: '#fff8ef',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '18px',
    fontSize: '13px',
    color: '#6a5944',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))',
    gap: '14px',
  },
  card: {
    display: 'grid',
    gap: '10px',
    padding: '14px',
    borderRadius: '18px',
    background: 'rgba(255, 251, 245, 0.84)',
    border: '1px solid rgba(61, 49, 33, 0.09)',
    boxShadow: '0 12px 28px rgba(73, 57, 33, 0.06)',
  },
  iconFrame: {
    minHeight: '52px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '14px',
    background: 'linear-gradient(180deg, #fff8ef 0%, #efe3d1 100%)',
    color: '#231d15',
  },
  label: {
    fontSize: '12px',
    lineHeight: 1.35,
    color: '#574b3c',
    textAlign: 'center',
    wordBreak: 'break-word',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
