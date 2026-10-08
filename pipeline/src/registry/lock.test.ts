import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { withRegistryLock } from './lock.js'

describe('registry lock', () => {
  it('runs sequential sections without deadlock', async () => {
    const order: string[] = []

    await withRegistryLock('test-first', async () => {
      order.push('first')
    })
    await withRegistryLock('test-second', async () => {
      order.push('second')
    })

    assert.deepEqual(order, ['first', 'second'])
  })

  it('allows nested acquisition within one process', async () => {
    const order: string[] = []

    await withRegistryLock('test-outer', async () => {
      order.push('outer')
      await withRegistryLock('test-inner', async () => {
        order.push('inner')
      })
    })

    assert.deepEqual(order, ['outer', 'inner'])
  })

  it('releases the lock when the section throws', async () => {
    await assert.rejects(
      withRegistryLock('test-throw', async () => {
        throw new Error('boom')
      }),
      /boom/,
    )

    let ran = false
    await withRegistryLock('test-after-throw', async () => {
      ran = true
    })
    assert.equal(ran, true)
  })
})
