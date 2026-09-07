import * as React from 'react'
import { Div } from '@reference-ui/react'
import '@reference-ui/react/styles.css'
import { ReferenceLibrary } from '../components/ReferenceLibrary'
import { setupFocusVisible } from '../core/theme/primitives/forms/focus-visible'

setupFocusVisible()

export interface BookDecoratorProps {
  children: React.ReactNode
  theme?: 'dark' | 'light'
  layout?: 'story' | 'shell'
}

export function BookDecorator({ children, theme = 'dark', layout = 'story' }: BookDecoratorProps) {
  const isDark = theme === 'dark'

  React.useEffect(() => {
    document.documentElement.setAttribute('data-color-mode', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  if (layout === 'shell') {
    return (
      <ReferenceLibrary>
        <Div
          colorMode={isDark ? 'dark' : undefined}
          display="flex"
          height="100vh"
          width="100vw"
          overflow="hidden"
          bg={isDark ? 'gray.950' : 'gray.50'}
          color={isDark ? 'gray.100' : 'gray.900'}
          position="relative"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        >
          {children}
        </Div>
      </ReferenceLibrary>
    )
  }

  return (
    <ReferenceLibrary>
      <Div
        colorMode={isDark ? 'dark' : undefined}
        display="flex"
        flexDirection="column"
        boxSizing="border-box"
        height="100%"
        minHeight="100vh"
        width="100%"
        bg={isDark ? 'gray.950' : 'gray.50'}
        color={isDark ? 'gray.100' : 'gray.900'}
        position="relative"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      >
        <Div
          flex="1"
          minHeight="0"
          overflow="auto"
          padding="clamp(1.25rem, 4vw, 2.75rem)"
          display="flex"
          flexDirection="column"
        >
          <Div maxWidth="min(72rem, 100%)" width="100%" marginInline="auto" flex="1">
            {children}
          </Div>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}
