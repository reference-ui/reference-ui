import { describe, expect, it, vi } from 'vitest'
import { CoordinatorLedger } from './ledger'

/**
 * Unit proof for `coordination/ledger`: sibling-part completion without a
 * browser. Pins the coordinated-exit contract (born-closed parts, lone
 * parts, reopen resets) the Overlay Backdrop/Content pair relies on.
 */

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('CoordinatorLedger', () => {
  it('notifies once every registered part reports while closed', async () => {
    let present = false
    const ledger = new CoordinatorLedger(() => present)
    const onAllComplete = vi.fn()
    ledger.subscribe(onAllComplete)

    ledger.register('backdrop')
    ledger.register('content')
    ledger.reportFinished('backdrop')
    await flushMicrotasks()
    expect(onAllComplete).not.toHaveBeenCalled()

    ledger.reportFinished('content')
    await flushMicrotasks()
    expect(onAllComplete).toHaveBeenCalledTimes(1)
  })

  it('stays silent while present and after an unsubscribe', async () => {
    let present = true
    const ledger = new CoordinatorLedger(() => present)
    const onAllComplete = vi.fn()
    const unsubscribe = ledger.subscribe(onAllComplete)

    ledger.register('a')
    ledger.register('b')
    ledger.reportFinished('a')
    ledger.reportFinished('b')
    await flushMicrotasks()
    expect(onAllComplete).not.toHaveBeenCalled()

    present = false
    unsubscribe()
    ledger.reportFinished('a')
    ledger.reportFinished('b')
    await flushMicrotasks()
    expect(onAllComplete).not.toHaveBeenCalled()
  })

  it('completes early when a part unmounts mid-exit', async () => {
    const ledger = new CoordinatorLedger(() => false)
    const onAllComplete = vi.fn()
    ledger.subscribe(onAllComplete)

    ledger.register('a')
    ledger.register('b')
    ledger.reportFinished('a')
    ledger.unregister('b')
    await flushMicrotasks()
    expect(onAllComplete).toHaveBeenCalledTimes(1)
  })

  it('resets finished reports when the cycle reopens', async () => {
    let present = false
    const ledger = new CoordinatorLedger(() => present)
    const onAllComplete = vi.fn()
    ledger.subscribe(onAllComplete)

    ledger.register('a')
    ledger.register('b')
    present = true
    ledger.reset()
    present = false
    ledger.reportFinished('a')
    await flushMicrotasks()
    expect(onAllComplete).not.toHaveBeenCalled()
  })

  it('is active only while closed with more than one part', () => {
    let present = false
    const ledger = new CoordinatorLedger(() => present)
    expect(ledger.isActive()).toBe(false)

    ledger.register('a')
    expect(ledger.isActive()).toBe(false)

    ledger.register('b')
    expect(ledger.isActive()).toBe(true)

    present = true
    expect(ledger.isActive()).toBe(false)
  })
})
