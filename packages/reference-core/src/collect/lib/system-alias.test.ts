// Unit tests for the sync-time system barrel. They pin its export names to the generated system entry's runtime
// names, its calls to core's own bindings, and the named error a theme file gets when it reads baseSystem. They also
// pin the bootstrap import map's system id to this file, so the barrel, the entry and the map cannot drift apart.

import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { defineConfig } from '../../config/types.ts'
import * as core from '../../index.ts'
import { getRhythm } from '../../system/base/rhythm.ts'
import { systemEntrySource } from '../../system/base/sources.ts'
import { tokens } from '../surface/index.ts'
import { getFragmentBootstrapImportMap } from './bootstrap.ts'
import * as alias from './system-alias.ts'

const ALIAS_PATH = fileURLToPath(new URL('./system-alias.ts', import.meta.url))
const READ_MESSAGE = 'a theme file cannot read the system it is building; import upstream systems in ui.config'

// The runtime names the generated entry exports: its own declarations, then its re-exports.
function entryRuntimeNames(): string[] {
  const entry = systemEntrySource()
  const declared = [...entry.matchAll(/^export (?:function|const) (\w+)/gm)].map((match) => match[1])
  const reexported = [...entry.matchAll(/^export \{ ([^}]+) \} from /gm)].flatMap((match) =>
    match[1].split(',').map((name) => name.trim()),
  )
  return [...declared, ...reexported].sort()
}

// The error a read throws, captured whole so the test can check its name and message.
function thrownBy(read: () => unknown): unknown {
  try {
    read()
  } catch (error) {
    return error
  }
  return undefined
}

describe('sync-time system barrel', () => {
  it('exports exactly the runtime names the generated system entry exports', () => {
    expect(Object.keys(alias).sort()).toEqual(entryRuntimeNames())
  })

  it('re-exports core\'s own defineConfig, collectors and getRhythm', () => {
    expect(alias.defineConfig).toBe(defineConfig)
    expect(alias.tokens).toBe(tokens)
    expect(alias.getRhythm).toBe(getRhythm)
  })

  it('leaves getRhythm off the core root barrel, which the system id now owns', () => {
    expect(Object.keys(core)).not.toContain('getRhythm')
  })

  it('imports baseSystem, but the first read throws the named error', () => {
    const error = thrownBy(() => alias.baseSystem.name)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).name).toBe('ThemeSystemReadError')
    expect((error as Error).message).toBe(READ_MESSAGE)
  })

  it('refuses membership and key listing on baseSystem as well as a property read', () => {
    expect(() => 'name' in alias.baseSystem).toThrow(READ_MESSAGE)
    expect(() => Object.keys(alias.baseSystem)).toThrow(READ_MESSAGE)
  })

  it('is the target the fragment bootstrap import map aliases @reference-ui/system to', () => {
    expect(getFragmentBootstrapImportMap()['@reference-ui/system']).toBe(ALIAS_PATH)
  })
})
