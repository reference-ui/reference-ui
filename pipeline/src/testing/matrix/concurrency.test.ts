import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveMatrixPackageConcurrency } from './concurrency.js'

describe('resolveMatrixPackageConcurrency', () => {
  it('caps concurrency by Docker runtime CPUs when available', () => {
    assert.deepEqual(
      resolveMatrixPackageConcurrency({
        configuredConcurrency: 6,
        hostParallelism: 24,
        runtimeCpuCount: 2,
        totalPackages: 4,
      }),
      {
        concurrency: 2,
        configuredConcurrency: 6,
        hostParallelism: 24,
        runtimeCpuCount: 2,
        totalPackages: 4,
      },
    )
  })

  it('falls back to host parallelism when Docker CPU data is unavailable', () => {
    assert.deepEqual(
      resolveMatrixPackageConcurrency({
        configuredConcurrency: 6,
        hostParallelism: 8,
        runtimeCpuCount: null,
        totalPackages: 4,
      }),
      {
        concurrency: 4,
        configuredConcurrency: 6,
        hostParallelism: 8,
        runtimeCpuCount: null,
        totalPackages: 4,
      },
    )
  })

  it('normalizes invalid configured concurrency to one worker', () => {
    assert.deepEqual(
      resolveMatrixPackageConcurrency({
        configuredConcurrency: 0,
        hostParallelism: 8,
        runtimeCpuCount: 4,
        totalPackages: 4,
      }),
      {
        concurrency: 1,
        configuredConcurrency: 1,
        hostParallelism: 8,
        runtimeCpuCount: 4,
        totalPackages: 4,
      },
    )
  })
})