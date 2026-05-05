import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseDockerSizeToBytes, parseDockerSystemDfUsageBytes } from './ensure-container-runtime.js'

describe('ensure-container-runtime helpers', () => {
  it('parses Docker size strings into bytes', () => {
    assert.equal(parseDockerSizeToBytes('0B'), 0)
    assert.equal(parseDockerSizeToBytes('3.478MB'), 3_478_000)
    assert.equal(parseDockerSizeToBytes('88.27GB'), 88_270_000_000)
    assert.equal(parseDockerSizeToBytes('1.018GB'), 1_018_000_000)
  })

  it('returns null for unparseable Docker size strings', () => {
    assert.equal(parseDockerSizeToBytes('unknown'), null)
  })

  it('sums Docker system df JSON rows into total used bytes', () => {
    const output = [
      { Type: 'Images', Size: '1.018GB' },
      { Type: 'Containers', Size: '3.478MB' },
      { Type: 'Local Volumes', Size: '88.27GB' },
      { Type: 'Build Cache', Size: '0B' },
    ].map(row => JSON.stringify(row)).join('\n')

    assert.equal(parseDockerSystemDfUsageBytes(output), 89_291_478_000)
  })

  it('returns null when Docker system df output contains invalid JSON', () => {
    assert.equal(parseDockerSystemDfUsageBytes('{not-json}\n'), null)
  })
})