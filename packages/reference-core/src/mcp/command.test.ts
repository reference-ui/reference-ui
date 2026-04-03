import { describe, expect, it } from 'vitest'

import { resolveTransport } from './command'

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
})
