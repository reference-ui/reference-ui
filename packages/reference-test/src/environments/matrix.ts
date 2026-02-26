/**
 * Test matrix: React × Bundler. Each entry becomes a Vitest project.
 * Per-project ui.config.ts lives in configs/{name}/ui.config.ts
 */

export const MATRIX = [
  { name: 'react17-vite', react: '17' as const, bundler: 'vite' as const },
  { name: 'react18-vite', react: '18' as const, bundler: 'vite' as const },
  { name: 'react19-vite', react: '19' as const, bundler: 'vite' as const },
] as const

export type MatrixEntry = (typeof MATRIX)[number]
