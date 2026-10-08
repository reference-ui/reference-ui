import { DarkModeIcon, LightModeIcon } from '@reference-ui/lib'
import { useDocsTheme } from '../shared/providers/DocsThemeContext'
import { IconButton } from './IconButton'

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useDocsTheme()
  const isDark = colorMode === 'dark'

  return (
    <IconButton
      variant="ghost"
      label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleColorMode}
    >
      {isDark ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  )
}
