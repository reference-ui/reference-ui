import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createFragmentCollector } from './collector'

describe('createFragmentCollector', () => {
  const testGlobalKey = '__testFragments'

  beforeEach(() => {
    // Clean up globalThis before each test
    delete (globalThis as Record<string, unknown>)[testGlobalKey]
  })

  afterEach(() => {
    // Clean up globalThis after each test
    delete (globalThis as Record<string, unknown>)[testGlobalKey]
  })

  it('creates a collector with the correct config', () => {
    const collector = createFragmentCollector({
      name: 'test',
      globalKey: testGlobalKey,
    })

    expect(collector.config.name).toBe('test')
    expect(collector.config.globalKey).toBe(testGlobalKey)
    expect(collector.config.logLabel).toBe('fragments:test')
  })

  it('uses custom logLabel when provided', () => {
    const collector = createFragmentCollector({
      name: 'test',
      globalKey: testGlobalKey,
      logLabel: 'custom:label',
    })

    expect(collector.config.logLabel).toBe('custom:label')
  })

  it('initializes an empty collector on globalThis', () => {
    const collector = createFragmentCollector({
      name: 'test',
      globalKey: testGlobalKey,
    })

    collector.init()

    const global = (globalThis as Record<string, unknown>)[testGlobalKey]
    expect(Array.isArray(global)).toBe(true)
    expect(global).toHaveLength(0)
  })

  it('collects fragments when collector is initialized', () => {
    const collector = createFragmentCollector<{ value: number }>({
      name: 'test',
      globalKey: testGlobalKey,
    })

    collector.init()
    collector.collect({ value: 1 })
    collector.collect({ value: 2 })
    collector.collect({ value: 3 })

    const fragments = collector.getFragments()
    expect(fragments).toHaveLength(3)
    expect(fragments).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
  })

  it('does not collect when collector is not initialized', () => {
    const collector = createFragmentCollector<{ value: number }>({
      name: 'test',
      globalKey: testGlobalKey,
    })

    // Don't call init()
    collector.collect({ value: 1 })

    const fragments = collector.getFragments()
    expect(fragments).toHaveLength(0)
  })

  it('getFragments returns a copy of the collector array', () => {
    const collector = createFragmentCollector<{ value: number }>({
      name: 'test',
      globalKey: testGlobalKey,
    })

    collector.init()
    collector.collect({ value: 1 })

    const fragments1 = collector.getFragments()
    const fragments2 = collector.getFragments()

    // Should be different array instances
    expect(fragments1).not.toBe(fragments2)
    // But same contents
    expect(fragments1).toEqual(fragments2)
  })

  it('cleanup removes the collector from globalThis', () => {
    const collector = createFragmentCollector({
      name: 'test',
      globalKey: testGlobalKey,
    })

    collector.init()
    expect((globalThis as Record<string, unknown>)[testGlobalKey]).toBeDefined()

    collector.cleanup()
    expect((globalThis as Record<string, unknown>)[testGlobalKey]).toBeUndefined()
  })

  it('handles multiple init/cleanup cycles', () => {
    const collector = createFragmentCollector<{ value: number }>({
      name: 'test',
      globalKey: testGlobalKey,
    })

    // First cycle
    collector.init()
    collector.collect({ value: 1 })
    expect(collector.getFragments()).toHaveLength(1)
    collector.cleanup()

    // Second cycle
    collector.init()
    collector.collect({ value: 2 })
    collector.collect({ value: 3 })
    expect(collector.getFragments()).toHaveLength(2)
    expect(collector.getFragments()).toEqual([{ value: 2 }, { value: 3 }])
    collector.cleanup()
  })

  it('supports different fragment types', () => {
    interface CustomFragment {
      id: string
      data: Record<string, unknown>
    }

    const collector = createFragmentCollector<CustomFragment>({
      name: 'test',
      globalKey: testGlobalKey,
    })

    collector.init()
    collector.collect({
      id: 'frag-1',
      data: { foo: 'bar', nested: { value: 123 } },
    })

    const fragments = collector.getFragments()
    expect(fragments[0].id).toBe('frag-1')
    expect(fragments[0].data.foo).toBe('bar')
    expect(fragments[0].data.nested).toEqual({ value: 123 })
  })

  it('handles collectors with different global keys independently', () => {
    const collector1 = createFragmentCollector<number>({
      name: 'collector1',
      globalKey: '__test1',
    })

    const collector2 = createFragmentCollector<string>({
      name: 'collector2',
      globalKey: '__test2',
    })

    collector1.init()
    collector2.init()

    collector1.collect(1)
    collector1.collect(2)
    collector2.collect('a')
    collector2.collect('b')

    expect(collector1.getFragments()).toEqual([1, 2])
    expect(collector2.getFragments()).toEqual(['a', 'b'])

    collector1.cleanup()
    collector2.cleanup()
  })

  it('returns empty array when getting fragments before init', () => {
    const collector = createFragmentCollector({
      name: 'test',
      globalKey: testGlobalKey,
    })

    const fragments = collector.getFragments()
    expect(fragments).toEqual([])
  })

  it('returns empty array when getting fragments after cleanup', () => {
    const collector = createFragmentCollector<number>({
      name: 'test',
      globalKey: testGlobalKey,
    })

    collector.init()
    collector.collect(1)
    collector.cleanup()

    const fragments = collector.getFragments()
    expect(fragments).toEqual([])
  })
})
