import type { TsPackagerCompletionEvent } from './ts/types'

export interface PackagerBundleCompletePayload {
  packageCount: number
  durationMs: number
}

export type PackagerEvents = {
  // Triggers

  /** Run the runtime bundle phase needed before reference builds */
  'run:packager:runtime:bundle': Record<string, never>

  /** Run full bundle (esbuild, copy files, write package.json to outDir) */
  'run:packager:bundle': Record<string, never>

  /** Run declaration generation for the latest requested packager-ts phase */
  'run:packager-ts': {
    completionEvent: TsPackagerCompletionEvent
  }

  // Notifications

  /** Packager worker is up and subscribed */
  'packager:ready': Record<string, never>

  /** Packager-ts worker is up and subscribed */
  'packager-ts:ready': Record<string, never>

  /** Runtime bundle phase complete (react/system/styled written to outDir) */
  'packager:runtime:complete': PackagerBundleCompletePayload

  /** Runtime declarations are needed for the current bundle state */
  'packager-ts:runtime:requested': Record<string, never>

  /** Runtime declarations are ready for packages needed by the reference build */
  'packager-ts:runtime:complete': Record<string, never>

  /** Any declaration-generation failure in the packager-ts subsystem */
  'packager-ts:failed': Record<string, never>

  /** Bundle complete (packages written to outDir) */
  'packager:complete': PackagerBundleCompletePayload

  /** Final declarations are needed for the current bundle state */
  'packager-ts:final:requested': Record<string, never>

  /** TypeScript declarations generated (packager-ts worker); also emitted by packager when skipTypescript so sync always waits on this */
  'packager-ts:complete': Record<string, never>
}
