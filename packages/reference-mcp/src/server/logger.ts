// Shared stderr log sink for the MCP server and pipeline.
// It takes log arguments and emits [ref mcp]-prefixed lines; debug stays silent unless
// REF_DEBUG or DEBUG is set. stdout stays clean for stdio transport.
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
