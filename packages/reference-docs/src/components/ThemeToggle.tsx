import { Div, Span, css } from '@reference-ui/react'
import { useDocsTheme } from '../context/DocsThemeContext'

const segment = ({ active }: { active: boolean }) =>
  css({
    flex: '1',
    minWidth: '0',
    border: 'none',
    borderRadius: 'md',
    fontSize: '0.6875rem',
    fontWeight: '600',
    letterSpacing: '0.02em',
    padding: '2r 3r',
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease',
    bg: active ? 'docsPanelBg' : 'transparent',
    color: active ? 'docsText' : 'docsMuted',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
    _hover: {
      color: 'docsText',
    },
  })

export function ThemeToggle() {
  const { colorMode, setColorMode } = useDocsTheme()

  return (
    <Div marginTop="6r" paddingTop="4r" borderTop="1px solid" borderTopColor="docsSidebarBorder">
      <Span
        display="block"
        fontSize="0.6875rem"
        fontWeight="600"
        textTransform="uppercase"
        letterSpacing="0.05em"
        color="docsNavHeading"
        marginBottom="2r"
      >
        Theme
      </Span>
      <Div
        display="flex"
        gap="2r"
        padding="2r"
        bg="docsDemoMutedBg"
        borderRadius="lg"
        border="1px solid"
        borderColor="docsPanelBorder"
      >
        <button
          type="button"
          className={segment({ active: colorMode === 'light' })}
          onClick={() => setColorMode('light')}
          aria-pressed={colorMode === 'light'}
        >
          Light
        </button>
        <button
          type="button"
          className={segment({ active: colorMode === 'dark' })}
          onClick={() => setColorMode('dark')}
          aria-pressed={colorMode === 'dark'}
        >
          Dark
        </button>
      </Div>
    </Div>
  )
}
