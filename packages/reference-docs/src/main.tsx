import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { ErrorBoundary } from './app/ErrorBoundary'
import { DocsThemeProvider } from './shared/providers/DocsThemeContext'
import { router } from './app/router'
import './docs-theme.fragments'
import './docs-syntax.css'
import '@reference-ui/react/styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DocsThemeProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </DocsThemeProvider>
  </React.StrictMode>
)
