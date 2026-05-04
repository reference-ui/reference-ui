import type { MatrixReactRuntime } from '../../../discovery/index.js'
import { getManagedReactProfile } from '../../react/index.js'

export const managedVite7DevDependencies = {
  '@vitejs/plugin-react': '^4.7.0',
  vite: '^7.3.1',
} as const

export function createManagedVite7IndexHtmlSource(options: {
  reactRuntime: MatrixReactRuntime
  title: string
}): string {
  const reactProfile = getManagedReactProfile(options.reactRuntime)

  return [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${options.title}</title>`,
    '  </head>',
    '  <body>',
    `    <div id="${reactProfile.mountElementId}"></div>`,
    '    <script type="module" src="/src/main.tsx"></script>',
    '  </body>',
    '</html>',
    '',
  ].join('\n')
}

export function createManagedVite7ConfigSource(): string {
  return [
    "import { referenceVite } from '@reference-ui/core'",
    "import react from '@vitejs/plugin-react'",
    "import { defineConfig } from 'vite'",
    '',
    'export default defineConfig({',
    '  plugins: [',
    '    react(),',
    '    referenceVite(),',
    '    {',
    "      name: 'reference-ui:matrix-vite-entry',",
    '      transformIndexHtml(html) {',
    "        if (html.includes('/src/main.tsx')) return html",
    "        return html.replace('</body>', '    <script type=\"module\" src=\"/src/main.tsx\"></script>\\n  </body>')",
    '      },',
    '    },',
    '  ],',
    '})',
    '',
  ].join('\n')
}