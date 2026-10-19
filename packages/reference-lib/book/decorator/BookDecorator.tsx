// Book story decorator: providers and chrome every story renders inside.
// It takes the story node plus theme and layout and emits it under ReferenceLibrary
// with focus-visible tracking armed and the color mode applied.
import * as React from 'react'
import { Div } from '@reference-ui/react'
import '@reference-ui/react/styles.css'
import { ReferenceLibrary } from '../../src/components/ReferenceLibrary'
import { setupFocusVisible } from '../../src/core/theme/primitives/forms/focus-visible'

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
      <Div
        colorMode={theme}
        display="flex"
        height="100vh"
        width="100vw"
        overflow="hidden"
        bg={isDark ? 'gray.950' : 'gray.50'}
        color={isDark ? 'gray.100' : 'gray.900'}
        position="relative"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      >
        <ReferenceLibrary>
          {children}
        </ReferenceLibrary>
      </Div>
    )
  }

  return (
    <Div
      colorMode={theme}
      display="flex"
      flexDirection="column"
      boxSizing="border-box"
      height="100%"
      minHeight="100%"
      width="100%"
      bg={isDark ? 'gray.950' : 'gray.50'}
      color={isDark ? 'gray.100' : 'gray.900'}
      position="relative"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    >
      <ReferenceLibrary>
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
      </ReferenceLibrary>
    </Div>
  )
}
