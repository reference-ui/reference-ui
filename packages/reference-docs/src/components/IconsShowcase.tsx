import * as React from 'react'
import * as RawIcons from '@reference-ui/lib/icons'
import { Div, Input, Label, P, Span } from '@reference-ui/react'
import { Button } from './Button'

type IconModule = Record<string, React.ComponentType<Record<string, unknown>>>

const MAX_INITIAL = 120

/**
 * Dynamic `import()` of `@reference-ui/lib/icons` was tree-shaken to an empty
 * namespace (`sideEffects: false`), so we use a static namespace import so
 * Rollup keeps every re-export.
 */
function toIconModule(m: Record<string, unknown>): IconModule {
  const out: IconModule = {}
  for (const k of Object.keys(m)) {
    if (!k.endsWith('Icon')) continue
    const v = m[k]
    if (v == null) continue
    if (typeof v !== 'function' && typeof v !== 'object') continue
    out[k] = v as React.ComponentType<Record<string, unknown>>
  }
  return out
}

export function IconsShowcase() {
  const mod = React.useMemo(
    () => toIconModule(RawIcons as unknown as Record<string, unknown>),
    [],
  )
  const [query, setQuery] = React.useState('')
  const [variant, setVariant] = React.useState<'outline' | 'filled'>('outline')

  const names = React.useMemo(
    () => Object.keys(mod).sort((a, b) => a.localeCompare(b)),
    [mod],
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return names
    return names.filter(n => n.toLowerCase().includes(q))
  }, [names, query])

  const visible = React.useMemo(() => {
    if (filtered.length <= MAX_INITIAL || query.trim()) return filtered
    return filtered.slice(0, MAX_INITIAL)
  }, [filtered, query])

  return (
    <Div display="flex" flexDirection="column" gap="4r">
      <Div display="flex" flexWrap="wrap" gap="3r" alignItems="flex-end">
        <Div flex="1" minWidth="200px">
          <Label display="block" fontSize="sm" fontWeight="600" color="docsText" marginBottom="1r">
            Search
          </Label>
          <Input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by name…"
            width="100%"
            maxWidth="28rem"
            padding="2r 3r"
            fontSize="md"
            borderRadius="md"
            border="1px solid"
            borderColor="docsPanelBorder"
            bg="docsPanelBg"
            color="docsText"
            aria-label="Filter icons by name"
          />
        </Div>
        <Div display="flex" gap="2r" alignItems="center">
          <Span fontSize="sm" color="docsMuted">
            Variant
          </Span>
          <Div display="flex" gap="1r">
            <Button
              type="button"
              size="sm"
              visual={variant === 'outline' ? 'solid' : 'ghost'}
              onClick={() => setVariant('outline')}
            >
              Outline
            </Button>
            <Button
              type="button"
              size="sm"
              visual={variant === 'filled' ? 'solid' : 'ghost'}
              onClick={() => setVariant('filled')}
            >
              Filled
            </Button>
          </Div>
        </Div>
      </Div>

      <P fontSize="sm" color="docsMuted" margin="0">
        Showing {visible.length} of {filtered.length}
        {filtered.length < names.length ? ` (filtered from ${names.length} total)` : ''}
        {!query.trim() && names.length > MAX_INITIAL
          ? ` — first ${MAX_INITIAL} listed; type in the search box to narrow the set or find a specific icon.`
          : null}
      </P>

      <Div
        display="grid"
        gap="3r"
        css={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(7.5rem, 1fr))',
        }}
      >
        {visible.map(name => {
          const Icon = mod[name]
          return (
            <Div
              key={name}
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap="2r"
              padding="3r 2r"
              borderRadius="lg"
              border="1px solid"
              borderColor="docsPanelBorder"
              bg="docsPanelBg"
              title={name}
              css={{ contentVisibility: 'auto' }}
            >
              <Div color="docsText" display="flex" alignItems="center" justifyContent="center" minHeight="32px">
                <Icon size={28} variant={variant} />
              </Div>
              <Span
                fontSize="10px"
                lineHeight="1.3"
                color="docsMuted"
                textAlign="center"
                wordBreak="break-word"
                maxWidth="100%"
              >
                {name}
              </Span>
            </Div>
          )
        })}
      </Div>
    </Div>
  )
}
