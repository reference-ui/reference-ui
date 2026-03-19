import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DocsThemeProvider } from './context/DocsThemeContext'
import { router } from './router'
import './tokens'
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
