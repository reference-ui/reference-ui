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