/**
 * Managed Vitest config generation for matrix fixtures and consumers.
 *
 * Emits the shared unit-test include contract from a Liquid template, with an
 * optional globalSetup entry when the fixture provides one. Keeps the Vitest
 * shape in one testable place instead of spreading it across runner code.
 */
export interface ManagedVitestConfigOptions {
  globalSetupPath?: string | null
}

import { managedGeneratedNotice, renderManagedTemplate } from '../template.js'

export function createManagedVitestConfigSource(options: ManagedVitestConfigOptions = {}): string {
  return renderManagedTemplate(new URL('./templates/vitest.config.ts.liquid', import.meta.url), {
    generatedNotice: managedGeneratedNotice,
    globalSetupPath: options.globalSetupPath,
  })
}