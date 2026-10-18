// Unit tests for harness case selection over the live catalog.
// They take the discovered cases and assert exact, prefix, and unknown matching.
// Selection stays in cases.ts so the CLI imports it without executing.
import { describe, expect, it } from 'vitest'
import { listCases, matchCases } from './cases.ts'

describe('matchCases', () => {
  it('exact id or folder returns the single case', () => {
    const all = listCases()
    expect(all.length).toBeGreaterThan(0)
    const first = all[0]
    expect(matchCases(first.id)).toEqual([first])
    expect(matchCases(first.folder)).toEqual([first])
  })

  it('prefix returns every case sharing it', () => {
    const all = listCases()
    const prefix = all[0].id.slice(0, 8)
    const matched = matchCases(prefix)
    expect(matched.length).toBeGreaterThan(0)
    expect(matched).toEqual(all.filter((c) => c.id.startsWith(prefix)))
  })

  it('unknown selector throws like getCase', () => {
    expect(() => matchCases('NEO-NOPE-99')).toThrow('unknown case')
  })
})
