/** Config loading and validation errors. Message strings live in the classes. */

export class ConfigNotFoundError extends Error {
  constructor(public readonly cwd: string) {
    super(
      `reference-ui: No ui.config.ts or ui.config.js found in ${cwd}.\n` +
        `Create a ui.config.ts file with your configuration:\n\n` +
        `  import { defineConfig } from '@reference-ui/core'\n` +
        `  export default defineConfig({ include: ['src/**/*.{ts,tsx}'] })`
    )
    this.name = 'ConfigNotFoundError'
  }
}

export class ConfigValidationError extends Error {
  static readonly MUST_EXPORT_OBJECT =
    'Config file must export a config object.\n' +
    'Make sure your ui.config.ts exports: export default defineConfig({ ... })'

  static readonly MUST_HAVE_INCLUDE =
    "Config must have an 'include' array with file patterns.\n" +
    "Example: export default defineConfig({ include: ['src/**/*.{ts,tsx}'] })"

  constructor(message: string) {
    super(message)
    this.name = 'ConfigValidationError'
  }
}

export class LoadConfigError extends Error {
  constructor(
    public readonly configPath: string,
    cause: unknown
  ) {
    super(
      `reference-ui: Failed to load ${configPath}:\n${cause instanceof Error ? cause.message : String(cause)}`
    )
    this.name = 'LoadConfigError'
  }
}
