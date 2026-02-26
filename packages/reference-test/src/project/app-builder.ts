/**
 * App file generation.
 * Generates React app files (App.tsx, index.html, main.tsx) programmatically.
 */

import { join } from 'node:path'
import { writeFile } from '../utils/file-system.js'
import type { ProjectConfig } from './types.js'

/**
 * Generate ui.config.ts content for the test config variant.
 * MVP: Minimal config with include for App.tsx and root files.
 */
function generateUiConfig(_variant: ProjectConfig['testConfigVariant'] = 'minimal'): string {
  return `import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  include: ['**/*.{ts,tsx}'],
})
`
}

/**
 * Generate React app files for the project.
 */
export async function buildApp(projectRoot: string, config: ProjectConfig): Promise<void> {
  const uiConfig = generateUiConfig(config.testConfigVariant)

  await writeFile(join(projectRoot, 'ui.config.ts'), uiConfig)
  await writeFile(
    join(projectRoot, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Test</title></head>
  <body><div id="root"></div><script type="module" src="/main.tsx"></script></body>
</html>
`
  )
  await writeFile(
    join(projectRoot, 'main.tsx'),
    `import React from 'react'
import ReactDOM from 'react-dom/client'
import '@reference-ui/react/styles.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
`
  )
  await writeFile(
    join(projectRoot, 'App.tsx'),
    `import { Div } from '@reference-ui/react'

export default function App() {
  return <Div data-testid="app-box" color="red.500">Hello</Div>
}
`
  )
}
