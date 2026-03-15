import { describe, expect, it } from 'vitest'

import { getRustTarget, getVirtualNativeTriple, SUPPORTED_VIRTUAL_NATIVE_TARGETS, TARGET_TRIPLES } from './targets'

describe('targets', () => {
  it('keeps supported runtime targets aligned with Rust targets', () => {
    expect(SUPPORTED_VIRTUAL_NATIVE_TARGETS).toEqual([
      'darwin-x64',
      'darwin-arm64',
      'linux-x64-gnu',
      'win32-x64-msvc',
    ])
    expect(TARGET_TRIPLES).toEqual({
      'darwin-x64': 'x86_64-apple-darwin',
      'darwin-arm64': 'aarch64-apple-darwin',
      'linux-x64-gnu': 'x86_64-unknown-linux-gnu',
      'win32-x64-msvc': 'x86_64-pc-windows-msvc',
    })
  })

  it('maps supported platform and architecture combinations to target triples', () => {
    expect(getVirtualNativeTriple('darwin', 'x64')).toBe('darwin-x64')
    expect(getVirtualNativeTriple('darwin', 'arm64')).toBe('darwin-arm64')
    expect(getVirtualNativeTriple('linux', 'x64')).toBe('linux-x64-gnu')
    expect(getVirtualNativeTriple('win32', 'x64')).toBe('win32-x64-msvc')
  })

  it('returns null for unsupported platform and architecture combinations', () => {
    expect(getVirtualNativeTriple('linux', 'arm64')).toBeNull()
    expect(getVirtualNativeTriple('win32', 'arm64')).toBeNull()
    expect(getVirtualNativeTriple('freebsd', 'x64')).toBeNull()
  })

  it('returns the Rust target for a runtime triple', () => {
    expect(getRustTarget('darwin-arm64')).toBe('aarch64-apple-darwin')
    expect(getRustTarget('linux-x64-gnu')).toBe('x86_64-unknown-linux-gnu')
  })
})
