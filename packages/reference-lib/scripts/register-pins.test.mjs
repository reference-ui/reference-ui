import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { assertNoRegisterPins, findRegisterPins } from './register-pins.mjs'

let dist

function plant(rel, text) {
  const full = join(dist, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, text)
}

// A forwardRef export left to inference: its props pin lib's publisher types.
const PINNED = `export declare const TabsList: React.ForwardRefExoticComponent<Omit<LocalStyleProps, 'x'>>;\n`
// The same export with its props alias named: the register reaches it.
const CLEAN = `export declare const TabsList: React.ForwardRefExoticComponent<TabsListProps & React.RefAttributes<HTMLDivElement>>;\n`

beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), 'ref-lib-register-pins-'))
})

afterEach(() => {
  rmSync(dist, { recursive: true, force: true })
})

describe('register-pins guard', () => {
  it('passes when every declaration names its props alias', () => {
    plant('components/Tabs/parts/list.d.ts', CLEAN)
    expect(findRegisterPins(dist)).toEqual([])
    expect(() => assertNoRegisterPins(dist)).not.toThrow()
  })

  it('fails naming a planted pinned declaration', () => {
    plant('components/Tabs/parts/list.d.ts', PINNED)
    expect(findRegisterPins(dist)).toEqual([
      { file: 'components/Tabs/parts/list.d.ts', names: ['LocalStyleProps'] },
    ])
    expect(() => assertNoRegisterPins(dist)).toThrow(
      /dist\/components\/Tabs\/parts\/list\.d\.ts: LocalStyleProps/,
    )
  })

  it('names every pinned file and every pinned name in it', () => {
    plant('components/Tabs/parts/list.d.ts', PINNED)
    plant(
      'components/Overlay/parts/Content.d.ts',
      'export type X = LocalStylePropName | LocalPrimitiveCssProp;\n',
    )
    let message = ''
    try {
      assertNoRegisterPins(dist)
    } catch (error) {
      message = error.message
    }
    expect(message).toContain('dist/components/Tabs/parts/list.d.ts: LocalStyleProps')
    expect(message).toContain(
      'dist/components/Overlay/parts/Content.d.ts: LocalStylePropName, LocalPrimitiveCssProp',
    )
  })

  it('scans .d.mts and .d.cts declarations outside runtime too', () => {
    plant('components/Tabs/parts/list.d.mts', PINNED)
    plant('components/Tabs/parts/other.d.cts', PINNED)
    expect(findRegisterPins(dist).map((pin) => pin.file)).toEqual([
      'components/Tabs/parts/list.d.mts',
      'components/Tabs/parts/other.d.cts',
    ])
  })

  it('exempts dist/runtime, where the publisher declares its register', () => {
    plant('runtime/reference-ui/react/react.d.mts', PINNED)
    expect(findRegisterPins(dist)).toEqual([])
    expect(() => assertNoRegisterPins(dist)).not.toThrow()
  })

  it('reads declaration files only, not JavaScript manifests', () => {
    plant('tasty/manifest.js', 'export const names = ["LocalPrimitiveCssProp"]\n')
    expect(findRegisterPins(dist)).toEqual([])
  })

  it('matches whole names only', () => {
    plant('components/Tabs/parts/list.d.ts', 'export type Y = LocalStylePropNames | LocalStylePropNameX;\n')
    expect(findRegisterPins(dist)).toEqual([])
  })
})
