// Stylesheet FIRST (B-13: the export must resolve or the build fails here),
// then the app. No aliases, no tribal setup — this is the documented path.
import '@reference-ui/lib/styles.css'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'

createRoot(document.getElementById('root')!).render(<App />)
