// Config loading and validation errors for Neo.
// It takes failure details and emits typed errors with actionable messages.
// This module is a Neo-owned copy of the core config errors trimmed to the surviving fields.

const PREFIX = 'reference-ui: '

abstract class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ConfigNotFoundError extends ConfigError {
  readonly cwd: string
  constructor(cwd: string) {
    super(
      `${PREFIX}No ui.config.ts or ui.config.js found in ${cwd}.\n` +
        `Create a ui.config.ts file with your configuration:\n\n` +
        `  import { defineConfig } from '@reference-ui/neo'\n` +
        `  export default defineConfig({ include: ['src/**/*.{ts,tsx}'] })`
    )
    this.cwd = cwd
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

  static invalidName(reason: string): ConfigValidationError {
    return new ConfigValidationError(`Config 'name' is invalid.\n${reason}`)
  }

  static invalidConfig(field: string, reason: string): ConfigValidationError {
    return new ConfigValidationError(`Config field '${field}' is invalid.\n${reason}`)
  }

  private constructor(message: string) {
    super(message)
  }
}

export { invalidBaseSystem } from '../system/base/validate.ts'

const MODULE_NOT_FOUND = 'ERR_MODULE_NOT_FOUND'
// Only a Reference UI-shaped miss earns the sync hint: a bare resolver
// failure for some other package is the author's dependency to fix, not ours.
const UPSTREAM_MARKER = /@reference-ui\/|\.reference-ui\//
const UPSTREAM_HINT =
  'This can happen when an upstream Reference UI package has not been synced. Run sync on the upstream package first.'

interface CodedError extends Error {
  code?: string
}

// Node reports an unsynced upstream two ways: the package specifier is
// missing, or its exports map points at a `.reference-ui/` system file sync
// has not written yet. Both arrive as ERR_MODULE_NOT_FOUND, sometimes wrapped,
// so walk the cause chain and test each link's own message for the marker.
function missingUpstream(cause: unknown): boolean {
  let current: unknown = cause
  for (let depth = 0; depth < 5 && current instanceof Error; depth++) {
    if ((current as CodedError).code === MODULE_NOT_FOUND && UPSTREAM_MARKER.test(current.message)) {
      return true
    }
    current = current.cause
  }
  return false
}

export class LoadConfigError extends ConfigError {
  readonly configPath: string
  constructor(
    configPath: string,
    cause: unknown
  ) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    const hint = missingUpstream(cause) ? `\n\n${UPSTREAM_HINT}` : ''
    super(`${PREFIX}Failed to load ${configPath}:\n${detail}${hint}`)
    this.configPath = configPath
  }
}
