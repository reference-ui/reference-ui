import { type ReactNode, useState } from 'react'
import { Code, Div, H2, P, Span, css } from '@reference-ui/react'

/**
 * Proves theme-aware tokens: the same token names resolve differently inside a
 * `colorMode` scoped subtree. Swatches are token-backed (not inline values), so
 * they recompute for the previewed mode.
 */
type Mode = 'light' | 'dark'

const modeButtonBase = css({
  appearance: 'none',
  border: '1px solid',
  borderRadius: '9999px',
  fontWeight: '600',
  fontSize: '0.875rem',
  padding: '2r 4r',
  cursor: 'pointer',
  transition: 'color 0.15s ease, background 0.15s ease, border-color 0.15s ease',
})

const modeButtonIdle = css({
  borderColor: 'docsBorder',
  background: 'transparent',
  color: 'docsMuted',
  _hover: { color: 'docsText' },
})

const modeButtonActive = css({
  borderColor: 'docsHighlight',
  background: 'docsActiveBg',
  color: 'docsText',
})

function TokenRow({
  label,
  token,
  children,
}: {
  label: string
  token: string
  children: ReactNode
}) {
  return (
    <Div
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap="4r"
      paddingY="3r"
      borderBottom="1px solid"
      borderBottomColor="docsBorder"
    >
      <Div display="flex" alignItems="center" gap="3r">
        {children}
        <Span color="docsText">{label}</Span>
      </Div>
      <Code fontFamily="mono" fontSize="0.8125rem" bg="docsInlineCodeBg" color="docsMuted" paddingX="2r" paddingY="1r" borderRadius="sm">
        {token}
      </Code>
    </Div>
  )
}

const swatch = {
  width: '3r',
  height: '3r',
  borderRadius: '9999px',
  border: '1px solid',
  borderColor: 'docsBorder',
} as const

export function ColorModeDemo() {
  const [mode, setMode] = useState<Mode>('light')

  return (
    <Div display="flex" flexDirection="column" gap="5r">
      <Div
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap="4r"
      >
        <P margin="0" color="docsMuted">
          Toggle the preview scope. The token names never change.
        </P>
        <Div display="flex" gap="2r">
          {(['light', 'dark'] as Mode[]).map(value => {
            const active = mode === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(value)}
                className={[modeButtonBase, active ? modeButtonActive : modeButtonIdle].join(' ')}
              >
                {value === 'light' ? 'Light' : 'Dark'}
              </button>
            )
          })}
        </Div>
      </Div>

      <Div
        colorMode={mode}
        bg="docsPageBg"
        color="docsText"
        border="1px solid"
        borderColor="docsBorder"
        borderRadius="md"
        padding="8r"
        display="flex"
        flexDirection="column"
        gap="6r"
      >
        <Div
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap="3r"
        >
          <H2 margin="0" fontSize="6r" color="docsText">
            {mode === 'light' ? 'Light mode tokens' : 'Dark mode tokens'}
          </H2>
          <Code fontFamily="mono" fontSize="0.8125rem" bg="docsInlineCodeBg" color="docsText" paddingX="2r" paddingY="1r" borderRadius="sm">
            {`colorMode="${mode}"`}
          </Code>
        </Div>

        <Div display="flex" flexDirection="column">
          <TokenRow label="Page background" token="docsPageBg">
            <Div {...swatch} bg="docsPageBg" />
          </TokenRow>
          <TokenRow label="Panel background" token="docsPanelBg">
            <Div {...swatch} bg="docsPanelBg" />
          </TokenRow>
          <TokenRow label="Border" token="docsBorder">
            <Div {...swatch} bg="docsBorder" />
          </TokenRow>
          <TokenRow label="Text" token="docsText">
            <Div {...swatch} bg="docsText" />
          </TokenRow>
          <TokenRow label="Muted text" token="docsMuted">
            <Div {...swatch} bg="docsMuted" />
          </TokenRow>
          <TokenRow label="Active background" token="docsActiveBg">
            <Div {...swatch} bg="docsActiveBg" />
          </TokenRow>
        </Div>
      </Div>
    </Div>
  )
}
