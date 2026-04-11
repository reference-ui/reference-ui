/**
 * Test matrix: React × Bundler. Each entry becomes a Playwright project.
 */

import { loadConfig } from '../config/index'

export const MATRIX = [
  { name: 'react17-vite5', react: '17' as const, bundler: 'vite' as const, bundlerVersion: '5' as const },
  { name: 'react18-vite5', react: '18' as const, bundler: 'vite' as const, bundlerVersion: '5' as const },
  { name: 'react19-vite5', react: '19' as const, bundler: 'vite' as const, bundlerVersion: '5' as const },
  { name: 'react18-webpack5', react: '18' as const, bundler: 'webpack' as const, bundlerVersion: '5' as const },
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

const WEBPACK_VERSIONS: Record<string, string> = {
  '5': '5.98.0',
}

const WEBPACK_DEV_SERVER_VERSIONS: Record<string, string> = {
  '5': '5.2.0',
}

export function getReactVersion(entry: MatrixEntry): string {
  return REACT_VERSIONS[entry.react] ?? '18.3.1'
}

export function getViteVersion(entry: MatrixEntry): string {
  return VITE_VERSIONS[entry.bundlerVersion] ?? '5.4.0'
}

export function getWebpackVersion(entry: MatrixEntry): string {
  return WEBPACK_VERSIONS[entry.bundlerVersion] ?? '5.98.0'
}

export function getWebpackDevServerVersion(entry: MatrixEntry): string {
  return WEBPACK_DEV_SERVER_VERSIONS[entry.bundlerVersion] ?? '5.2.0'
}

export function getPort(entry: MatrixEntry): number {
  const { basePort } = loadConfig()
  const i = MATRIX.indexOf(entry)
  return basePort + i
}
