import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  hasCompatibleReferenceRustBinaryContents,
  isReferenceRustBinaryCompatible,
} from './compatibility.js'

describe('hasCompatibleReferenceRustBinaryContents', () => {
  it('accepts binaries that advertise the full native API contract', () => {
    assert.equal(
      hasCompatibleReferenceRustBinaryContents(
        Buffer.from(
          [
            'getNativeCapabilities',
            'analyzeAtlas',
            'analyzeStyletrace',
            'analyzeStyletraceBindings',
            'analyzeStyletraceDetailed',
            'compileSystem',
            'scanSystem',
            'releaseScan',
            'scanAndEmitModules',
            'emitDtsSync',
            'emitDtsDetailed',
            'primitivesVocabulary',
          ].join('\0'),
        ),
      ),
      true,
    )
  })

  it('rejects binaries that are missing newer required exports', () => {
    assert.equal(
      hasCompatibleReferenceRustBinaryContents(
        Buffer.from(
          [
            'getNativeCapabilities',
            'scanAndEmitModules',
            'analyzeAtlas',
            'analyzeStyletrace',
          ].join('\0'),
        ),
      ),
      false,
    )
  })
})

describe('isReferenceRustBinaryCompatible', () => {
  it('accepts a host-target binary when the runtime compatibility check passes', () => {
    assert.equal(
      isReferenceRustBinaryCompatible({
        binaryPath: '/tmp/reference-native.darwin-x64.node',
        fileCompatibilityCheck: () => false,
        hostRuntimeCompatibilityCheck: () => true,
        hostTarget: 'darwin-x64',
        target: 'darwin-x64',
      }),
      true,
    )
  })

  it('falls back to the file compatibility check for non-host targets', () => {
    assert.equal(
      isReferenceRustBinaryCompatible({
        binaryPath: '/tmp/reference-native.darwin-arm64.node',
        fileCompatibilityCheck: () => true,
        hostRuntimeCompatibilityCheck: () => false,
        hostTarget: 'darwin-x64',
        target: 'darwin-arm64',
      }),
      true,
    )
  })

  it('rejects binaries when neither runtime nor file compatibility checks pass', () => {
    assert.equal(
      isReferenceRustBinaryCompatible({
        binaryPath: '/tmp/reference-native.darwin-x64.node',
        fileCompatibilityCheck: () => false,
        hostRuntimeCompatibilityCheck: () => false,
        hostTarget: 'darwin-x64',
        target: 'darwin-x64',
      }),
      false,
    )
  })
})
