export type PackagerEvents = {
  // Triggers
  
  /** Run full bundle (esbuild, copy files, write package.json to outDir) */
  'run:packager:bundle': Record<string, never>

  // Notifications
  
  /** Packager worker is up and subscribed */
  'packager:ready': Record<string, never>
  
  /** Bundle complete (packages written to outDir) */
  'packager:complete': Record<string, never>
}
