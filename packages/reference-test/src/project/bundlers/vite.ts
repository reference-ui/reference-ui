/**
 * Vite bundler implementation.
 */

import type { Bundler, BundlerConfig } from './bundler-interface.js'

export const viteBundler: Bundler = {
  name: 'vite',
  getConfig(_reactVersion: string): BundlerConfig {
    return {
      configFilename: 'vite.config.ts',
      configContent: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`,
    }
  },
  getBuildCommand(projectRoot: string): string[] {
    return ['pnpm', 'run', 'build']
  },
  getDevServerCommand(projectRoot: string, port: number): string[] {
    return ['pnpm', 'run', 'dev', '--', '--port', String(port)]
  },
}
