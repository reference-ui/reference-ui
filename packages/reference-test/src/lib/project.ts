/**
 * Generate a minimal Vite + React project in a temp dir for testing.
 */

import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface Project {
  root: string
  cleanup: () => Promise<void>
}

export async function createProject(): Promise<Project> {
  const root = await mkdtemp(join(tmpdir(), 'ref-test-'))

  const corePath = join(__dirname, '..', '..', '..', 'reference-core')

  const packageJson = {
    name: 'ref-test-app',
    private: true,
    type: 'module' as const,
    scripts: {
      build: 'vite build',
      dev: 'vite',
    },
    dependencies: {
      react: '18.3.1',
      'react-dom': '18.3.1',
      '@reference-ui/core': `file:${corePath}`,
    },
    devDependencies: {
      vite: '5.4.0',
      '@vitejs/plugin-react': '4.3.4',
      typescript: '~5.9.3',
    },
  }

  const files: Record<string, string> = {
    'package.json': JSON.stringify(packageJson, null, 2),
    'ui.config.ts': `import { defineConfig } from '@reference-ui/core'
export default defineConfig({ include: ['**/*.{ts,tsx}'] })
`,
    'index.html': `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>Test</title></head>
<body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>
`,
    'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
`,
    'main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import '@reference-ui/react/styles.css'
import App from './App'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
`,
    'App.tsx': `import { Div } from '@reference-ui/react'
export default function App() {
  return <Div data-testid="app-box" color="red.500">Hello</Div>
}
`,
    'tsconfig.json': JSON.stringify({
      compilerOptions: { target: 'ES2020', module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx' },
      include: ['**/*.ts', '**/*.tsx'],
    }, null, 2),
  }

  for (const [path, content] of Object.entries(files)) {
    await writeFile(join(root, path), content)
  }

  const { execa } = await import('execa')
  await execa('pnpm', ['install'], { cwd: root })

  return {
    root,
    cleanup: async () => {
      const { rm } = await import('node:fs/promises')
      await rm(root, { recursive: true, force: true })
    },
  }
}
