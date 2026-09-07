export const log = {
  info: (...args: unknown[]) => {
    console.error('[ref mcp]', ...args)
  },
  warn: (...args: unknown[]) => {
    console.error('[ref mcp:warn]', ...args)
  },
  error: (...args: unknown[]) => {
    console.error('[ref mcp:error]', ...args)
  },
  debug: (module: string, ...args: unknown[]) => {
    if (process.env.REF_DEBUG || process.env.DEBUG) {
      console.error(`[ref mcp:debug:${module}]`, ...args)
    }
  },
}
