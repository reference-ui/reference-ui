import { useState } from 'react'
import { Code, Div, H2, P, Span, css } from '@reference-ui/react'

type Mode = 'light' | 'dark'

const modeButton = ({ active }: { active: boolean }) =>
  css({
    appearance: 'none',
    border: '1px solid',
    borderColor: active ? 'docsAccent' : 'docsPanelBorder',
    bg: active ? 'docsAccent' : 'docsPanelBg',
    color: active ? 'white' : 'docsText',
    borderRadius: '9999px',
    fontWeight: '600',
    padding: '2r 4r',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    _hover: active
      ? {}
      : {
          borderColor: 'docsAccent',
          color: 'docsAccent',
        },
  })

function TokenRow({
  label,
  token,
  swatchBg,
  swatchBorder = 'docsPanelBorder',
}: {
  label: string
  token: string
  swatchBg: string
  swatchBorder?: string
}) {
  return (
    <Div
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap="4r"
      padding="3r 0"
      borderBottom="1px solid"
      borderBottomColor="docsPanelBorder"
    >
      <Div display="flex" alignItems="center" gap="3r">
        <Div
          width="1rem"
          height="1rem"
          borderRadius="9999px"
          bg={swatchBg}
          border="1px solid"
          borderColor={swatchBorder}
        />
        <Span color="docsText">{label}</Span>
      </Div>
      <Code>{token}</Code>
    </Div>
  )
}

export function ColorModeDemo() {
  const [mode, setMode] = useState<Mode>('light')
  const theme = mode

  return (
    <Div display="flex" flexDirection="column" gap="6r">
      <Div
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap="4r"
      >
        <P margin="0" color="docsMuted">
          Toggle the preview scope below. The same token names are used in both modes.
        </P>
        <Div display="flex" gap="2r">
          {(['light', 'dark'] as Mode[]).map(value => (
            <button
              key={value}
              type="button"
              className={modeButton({ active: mode === value })}
              onClick={() => setMode(value)}
            >
              {value === 'light' ? 'Light mode' : 'Dark mode'}
            </button>
          ))}
        </Div>
      </Div>

      <Div
        colorMode={theme}
        bg="docsPageBg"
        color="docsText"
        border="1px solid"
        borderColor="docsPanelBorder"
        borderRadius="2xl"
        padding="8r"
        display="flex"
        flexDirection="column"
        gap="6r"
      >
        <Div
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap="3r"
        >
          <Div display="flex" flexDirection="column" gap="1r">
            <Span fontSize="sm" fontWeight="600" color="docsMuted">
              Preview scope
            </Span>
            <H2 margin="0" fontSize="7r" color="docsText">
              {mode === 'light' ? 'Light mode tokens' : 'Dark mode tokens'}
            </H2>
          </Div>
          <Code>{`colorMode="${theme}"`}</Code>
        </Div>

        <Div
          className={css({
            display: 'grid',
            gap: '4r',
            '@media (min-width: 900px)': {
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
            },
          })}
        >
          <Div
            bg="docsPanelBg"
            border="1px solid"
            borderColor="docsPanelBorder"
            borderRadius="xl"
            padding="6r"
            display="flex"
            flexDirection="column"
            gap="5r"
          >
            <Div display="flex" flexDirection="column" gap="2r">
              <Span fontSize="sm" fontWeight="600" color="docsAccent">
                Surface tokens
              </Span>
              <P margin="0" color="docsMuted">
                These panels, borders, and text all come from docs-local tokens defined
                with a default value plus a dark override.
              </P>
            </Div>

            <Div
              bg="docsAccentSoft"
              border="1px solid"
              borderColor="docsPanelBorder"
              borderRadius="lg"
              padding="5r"
              display="flex"
              flexDirection="column"
              gap="2r"
            >
              <Span fontWeight="600" color="docsAccent">
                Accent token
              </Span>
              <P margin="0" color="docsText">
                Useful for links, emphasis, and focus states while still adapting across
                themes.
              </P>
            </Div>

            <Div display="flex" flexDirection="column" gap="2r">
              <Span fontWeight="600" color="docsText">
                Text contrast check
              </Span>
              <P margin="0" color="docsText">
                Primary copy uses <Code>docsText</Code>.
              </P>
              <P margin="0" color="docsMuted">
                Secondary copy uses <Code>docsMuted</Code>.
              </P>
            </Div>
          </Div>

          <Div
            bg="docsPanelBg"
            border="1px solid"
            borderColor="docsPanelBorder"
            borderRadius="xl"
            padding="6r"
            display="flex"
            flexDirection="column"
            gap="2r"
          >
            <Span fontSize="sm" fontWeight="600" color="docsAccent">
              Token readout
            </Span>
            <TokenRow label="Page background" token="docsPageBg" swatchBg="docsPageBg" />
            <TokenRow
              label="Panel background"
              token="docsPanelBg"
              swatchBg="docsPanelBg"
            />
            <TokenRow
              label="Panel border"
              token="docsPanelBorder"
              swatchBg="docsPanelBorder"
              swatchBorder="docsPanelBorder"
            />
            <TokenRow label="Primary text" token="docsText" swatchBg="docsText" />
            <TokenRow label="Muted text" token="docsMuted" swatchBg="docsMuted" />
            <TokenRow label="Accent" token="docsAccent" swatchBg="docsAccent" />
          </Div>
        </Div>
      </Div>
    </Div>
  )
}
