import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'reference-docs-color-mode'

export type DocsColorMode = 'light' | 'dark'

type DocsThemeValue = {
  colorMode: DocsColorMode
  setColorMode: (mode: DocsColorMode) => void
  toggleColorMode: () => void
}

const DocsThemeContext = createContext<DocsThemeValue | null>(null)

function readInitialMode(): DocsColorMode {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function DocsThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = useState<DocsColorMode>(readInitialMode)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, colorMode)
    document.documentElement.style.colorScheme = colorMode
  }, [colorMode])

  const value = useMemo(
    (): DocsThemeValue => ({
      colorMode,
      setColorMode,
      toggleColorMode: () => setColorMode(m => (m === 'dark' ? 'light' : 'dark')),
    }),
    [colorMode]
  )

  return <DocsThemeContext.Provider value={value}>{children}</DocsThemeContext.Provider>
}

export function useDocsTheme(): DocsThemeValue {
  const ctx = useContext(DocsThemeContext)
  if (!ctx) {
    throw new Error('useDocsTheme must be used within DocsThemeProvider')
  }
  return ctx
}
