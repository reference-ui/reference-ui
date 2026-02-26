/**
 * Test matrix: React × Bundler. Each entry becomes a Playwright project.
 */

export const MATRIX = [
  { name: 'react17-vite5', react: '17' as const, bundler: 'vite' as const, bundlerVersion: '5' as const },
  { name: 'react18-vite5', react: '18' as const, bundler: 'vite' as const, bundlerVersion: '5' as const },
  { name: 'react19-vite5', react: '19' as const, bundler: 'vite' as const, bundlerVersion: '5' as const },
] as const

export type MatrixEntry = (typeof MATRIX)[number]

const REACT_VERSIONS: Record<string, string> = {
  '17': '17.0.2',
  '18': '18.3.1',
  '19': '19.0.0',
}

const VITE_VERSIONS: Record<string, string> = {
  '5': '5.4.0',
  '4': '4.5.0',
}

export function getReactVersion(entry: MatrixEntry): string {
  return REACT_VERSIONS[entry.react] ?? '18.3.1'
}

export function getViteVersion(entry: MatrixEntry): string {
  return VITE_VERSIONS[entry.bundlerVersion] ?? '5.4.0'
}

const BASE_PORT = 5174
export function getPort(entry: MatrixEntry): number {
  const i = MATRIX.indexOf(entry)
  return BASE_PORT + i
}
