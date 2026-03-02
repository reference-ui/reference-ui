/** Config loading and validation errors. */

const PREFIX = 'reference-ui: '

abstract class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ConfigNotFoundError extends ConfigError {
  constructor(public readonly cwd: string) {
    super(
      `${PREFIX}No ui.config.ts or ui.config.js found in ${cwd}.\n` +
        `Create a ui.config.ts file with your configuration:\n\n` +
        `  import { defineConfig } from '@reference-ui/core'\n` +
        `  export default defineConfig({ include: ['src/**/*.{ts,tsx}'] })`
    )
  }
}

export class ConfigValidationError extends ConfigError {
  static mustExportObject(): ConfigValidationError {
    return new ConfigValidationError(
      'Config file must export a config object.\n' +
        'Make sure your ui.config.ts exports: export default defineConfig({ ... })'
    )
  }

  static mustHaveInclude(): ConfigValidationError {
    return new ConfigValidationError(
      "Config must have an 'include' array with file patterns.\n" +
        "Example: export default defineConfig({ include: ['src/**/*.{ts,tsx}'] })"
    )
  }

  static mustHaveName(): ConfigValidationError {
    return new ConfigValidationError(
      "Config must have a non-empty 'name' for this design system.\n" +
        "Example: export default defineConfig({ name: 'my-design-system', include: ['src/**/*.{ts,tsx}'] })"
    )
  }

  private constructor(message: string) {
    super(message)
  }
}

export class LoadConfigError extends ConfigError {
  constructor(
    public readonly configPath: string,
    cause: unknown
  ) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    super(`${PREFIX}Failed to load ${configPath}:\n${detail}`)
  }
}
