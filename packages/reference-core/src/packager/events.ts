export type PackagerEvents = {
  // Triggers

  /** Run the runtime bundle phase needed before reference builds */
  'run:packager:runtime:bundle': Record<string, never>

  /** Run full bundle (esbuild, copy files, write package.json to outDir) */
  'run:packager:bundle': Record<string, never>

  // Notifications

  /** Packager worker is up and subscribed */
  'packager:ready': Record<string, never>

  /** Runtime bundle phase complete (react/system/styled written to outDir) */
  'packager:runtime:complete': Record<string, never>

  /** Runtime declarations are ready for packages needed by the reference build */
  'packager-ts:runtime:complete': Record<string, never>

  /** Bundle complete (packages written to outDir) */
  'packager:complete': Record<string, never>

  /** TypeScript declarations generated (packager-ts worker); also emitted by packager when skipTypescript so sync always waits on this */
  'packager-ts:complete': Record<string, never>
}
