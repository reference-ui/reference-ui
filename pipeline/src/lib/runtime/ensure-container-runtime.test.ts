import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseDockerSizeToBytes, parseDockerSystemDfUsageBytes, shouldReclaimDockerDiskSpace } from './ensure-container-runtime.js'

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

  it('triggers disk reclamation when free disk is below the required threshold plus safety buffer', () => {
    const minBytes = 20 * 1024 * 1024 * 1024 // 20 GiB
    const runtime = {
      context: 'colima',
      cpuCount: 12,
      diskFreeBytes: 19 * 1024 * 1024 * 1024, // 19 GiB (< 20 GiB)
      diskTotalBytes: 100 * 1024 * 1024 * 1024,
      diskUsedBytes: 81 * 1024 * 1024 * 1024,
      memoryBytes: 24 * 1024 * 1024 * 1024,
    }

    assert.equal(shouldReclaimDockerDiskSpace({ minimumDockerDiskFreeBytes: minBytes }, runtime), true)

    // Even with 25 GiB free (more than 20 GiB, but less than 20 + 10 = 30 GiB buffer), it should proactively reclaim
    runtime.diskFreeBytes = 25 * 1024 * 1024 * 1024
    assert.equal(shouldReclaimDockerDiskSpace({ minimumDockerDiskFreeBytes: minBytes }, runtime), true)

    // With 50 GiB free, no reclamation needed
    runtime.diskFreeBytes = 50 * 1024 * 1024 * 1024
    assert.equal(shouldReclaimDockerDiskSpace({ minimumDockerDiskFreeBytes: minBytes }, runtime), false)

    // When no minimumDockerDiskFreeBytes is set or diskFreeBytes is null, do not trigger
    assert.equal(shouldReclaimDockerDiskSpace({}, runtime), false)
    assert.equal(shouldReclaimDockerDiskSpace({ minimumDockerDiskFreeBytes: minBytes }, { ...runtime, diskFreeBytes: null }), false)
  })
})