/**
 * Unit test suite verifying target triple resolution and mapping tables.
 * Asserts correspondence between Node runtime platform keys and Rust compilation targets.
 * Validates npm package name construction for platform-specific native addons.
 */
import { describe, expect, it } from 'vitest'

import {
  getRustTarget,
  getReferenceNativePackageName,
  getReferenceNativeTriple,
  SUPPORTED_REFERENCE_NATIVE_TARGETS,
  TARGET_TRIPLES,
} from './targets'

describe('targets', () => {
  it('keeps supported runtime targets aligned with Rust targets', () => {
    expect(SUPPORTED_REFERENCE_NATIVE_TARGETS).toEqual([
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
    expect(getReferenceNativeTriple('darwin', 'x64')).toBe('darwin-x64')
    expect(getReferenceNativeTriple('darwin', 'arm64')).toBe('darwin-arm64')
    expect(getReferenceNativeTriple('linux', 'x64')).toBe('linux-x64-gnu')
    expect(getReferenceNativeTriple('win32', 'x64')).toBe('win32-x64-msvc')
  })

  it('returns null for unsupported platform and architecture combinations', () => {
    expect(getReferenceNativeTriple('linux', 'arm64')).toBeNull()
    expect(getReferenceNativeTriple('win32', 'arm64')).toBeNull()
    expect(getReferenceNativeTriple('freebsd', 'x64')).toBeNull()
  })

  it('returns the Rust target for a runtime triple', () => {
    expect(getRustTarget('darwin-arm64')).toBe('aarch64-apple-darwin')
    expect(getRustTarget('linux-x64-gnu')).toBe('x86_64-unknown-linux-gnu')
  })

  it('returns the npm package name for a runtime triple', () => {
    expect(getReferenceNativePackageName('linux-x64-gnu')).toBe(
      '@reference-ui/rust-linux-x64-gnu'
    )
    expect(getReferenceNativePackageName('darwin-arm64')).toBe(
      '@reference-ui/rust-darwin-arm64'
    )
  })
})
