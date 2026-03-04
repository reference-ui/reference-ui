export type SystemEvents = {
  // Triggers

  /** Tell the config step to run: eval + generate panda.config. Payload carries cwd. */
  'run:system:config': { cwd: string }
  /**
   * Run CSS only (cssgen). Fast path — file changes in watch mode.
   * Requires a valid panda.config to already exist.
   */
  'run:panda:css': Record<string, never>
  /**
   * Run full Panda pipeline: codegen (TS utilities) + CSS + baseSystem.
   * Slower — triggered after config is written (cold start or config-affecting change).
   */
  'run:panda:codegen': Record<string, never>

  // Notifications

  /** Both workers are up and subscribed */
  'system:ready': Record<string, never>

  // Config worker (eval + panda.config generation)

  /** Config worker is up and subscribed */
  'system:config:ready': Record<string, never>
  /** Config worker done: eval ran, panda.config written */
  'system:config:complete': Record<string, never>

  // Panda worker (cssgen + codegen + baseSystem)

  /** Panda worker is up and subscribed */
  'system:panda:ready': Record<string, never>
  /** Panda CSS done (styles.css written) */
  'system:panda:css': Record<string, never>
  /** Panda codegen done (TS utilities + baseSystem generated) */
  'system:panda:codegen': Record<string, never>

  // Pipeline

  /** Full system pipeline done. Packager gate. */
  'system:complete': Record<string, never>
}
