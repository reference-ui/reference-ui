// Vitest tests for ref-mcp transport selection.
// They take option shapes plus argv vectors and assert stdio/HTTP resolution and conflicts.
import { describe, expect, it } from 'vitest'

import { type McpCommandOptions, resolveTransport } from './command'
import { createMcpProgram } from './index'

// Parses argv through the real commander program and captures what it would run.
// The run handler is a stub, so no server starts.
async function parseOptions(argv: string[]): Promise<McpCommandOptions> {
  let captured: McpCommandOptions | undefined
  const program = createMcpProgram(async options => {
    captured = options
  })
  await program.parseAsync(argv, { from: 'user' })
  if (!captured) throw new Error('ref-mcp program did not reach its action')
  return captured
}

describe('resolveTransport', () => {
  it('defaults to stdio when no transport or http options are provided', () => {
    expect(resolveTransport()).toBe('stdio')
  })

  it('treats an explicit port as an HTTP invocation', () => {
    expect(resolveTransport({ port: 3697 })).toBe('http')
  })

  it('treats an explicit host as an HTTP invocation', () => {
    expect(resolveTransport({ host: '0.0.0.0' })).toBe('http')
  })

  it('honors an explicit transport override', () => {
    expect(resolveTransport({ transport: 'stdio', port: 3697 })).toBe('stdio')
    expect(resolveTransport({ transport: 'http' })).toBe('http')
  })

  it('supports explicit project and env var in options', () => {
    const opts = { project: 'packages/reference-lib' }
    expect(opts.project).toBe('packages/reference-lib')
  })
})

describe('ref-mcp argv transport selection', () => {
  it('selects http for --port without --transport', async () => {
    expect(resolveTransport(await parseOptions(['--port', '3000']))).toBe('http')
  })

  it('selects http for --http with --port', async () => {
    const options = await parseOptions(['--http', '--port', '3000'])
    expect(resolveTransport(options)).toBe('http')
  })

  it('runs stdio when no transport flags are given', async () => {
    expect(resolveTransport(await parseOptions([]))).toBe('stdio')
  })

  it('lets an explicit --transport stdio win over --port', async () => {
    const options = await parseOptions(['--transport', 'stdio', '--port', '3000'])
    expect(resolveTransport(options)).toBe('stdio')
  })

  it('refuses --http combined with a different --transport', async () => {
    const options = await parseOptions(['--http', '--transport', 'stdio'])
    const run = () => resolveTransport(options)
    expect(run).toThrow('--http conflicts with --transport stdio')
  })
})
