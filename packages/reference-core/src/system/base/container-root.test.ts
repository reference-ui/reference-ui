// Unit tests for the upstream container-root scan. They take hand-built
// published stream entries and pin root detection across selectors,
// properties, buckets, and the absent-stream edge cases.
import { describe, expect, it } from 'vitest'
import { hasUpstreamContainerRoot } from './container-root.ts'
import type { BaseSystem, SystemStreams } from './types.ts'

function system(streams?: SystemStreams[]): BaseSystem {
  return { name: 'upstream', fragment: '', streams }
}

function entry(global?: string): SystemStreams {
  return { name: 'upstream', preamble: '', global }
}

describe('hasUpstreamContainerRoot', () => {
  it('finds body container-type in an upstream global block', () => {
    const global = ':root { --x: 1 }\nbody { font-size: 4px; container-type: inline-size }'
    expect(hasUpstreamContainerRoot([system([entry(global)])])).toBe(true)
  })

  it('accepts :root and html selectors plus containerType and container spellings', () => {
    expect(
      hasUpstreamContainerRoot([system([entry(':root { containerType: size }')])])
    ).toBe(true)
    expect(hasUpstreamContainerRoot([system([entry('html { container: inline-size }')])])).toBe(
      true
    )
  })

  it('accepts the root selector inside a comma group', () => {
    expect(
      hasUpstreamContainerRoot([system([entry('h1, body, p { container-type: normal }')])])
    ).toBe(true)
  })

  it('rejects container properties on non-root selectors', () => {
    expect(hasUpstreamContainerRoot([system([entry('.card { container-type: size }')])])).toBe(
      false
    )
  })

  it('rejects lookalike properties and values', () => {
    expect(hasUpstreamContainerRoot([system([entry('body { container-name: side }')])])).toBe(
      false
    )
    expect(hasUpstreamContainerRoot([system([entry('body { color: red }')])])).toBe(false)
  })

  it('returns false without upstreams, streams, or global blocks', () => {
    expect(hasUpstreamContainerRoot([])).toBe(false)
    expect(hasUpstreamContainerRoot([system(undefined)])).toBe(false)
    expect(hasUpstreamContainerRoot([system([entry(undefined)])])).toBe(false)
  })
})
