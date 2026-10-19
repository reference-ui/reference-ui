/**
 * Managed Playwright config generation for matrix fixtures and consumers.
 *
 * Takes the active bundler set and emits a Playwright config source with one
 * project and dev-server block per bundler. Pins and image tags come from the
 * central dependencies module so config and container stay in lockstep.
 */
import type { MatrixBundlerStrategy } from '../../discovery/index.js'
import { managedGeneratedNotice, renderManagedTemplate } from '../template.js'

export function createManagedPlaywrightConfigSource(
  bundlers: readonly MatrixBundlerStrategy[],
): string {
  const projects: Array<{ baseURL: string; name: string }> = []
  const webServers: Array<{ command: string; url: string }> = []

  for (const bundler of bundlers) {
    if (bundler === 'vite7') {
      projects.push({
        baseURL: 'http://127.0.0.1:4173',
        name: 'vite7',
      })
      webServers.push({
        command: 'pnpm exec vite --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
      })
      continue
    }

    if (bundler === 'webpack5') {
      projects.push({
        baseURL: 'http://127.0.0.1:4174',
        name: 'webpack5',
      })
      webServers.push({
        command: 'pnpm exec webpack serve --config webpack.config.cjs --host 127.0.0.1 --port 4174',
        url: 'http://127.0.0.1:4174',
      })
    }
  }

  return renderManagedTemplate(new URL('./templates/playwright.config.ts.liquid', import.meta.url), {
    generatedNotice: managedGeneratedNotice,
    projects,
    webServers,
  })
}