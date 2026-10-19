// Vitest tests for the declaration cleaner.
// They take temp dist trees and assert stale .d.ts files are removed while runtime
// .mjs and .css files are left untouched.
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanDeclarations } from './clean-declarations.mjs'

let root

function write(rel, text = 'x\n') {
  const full = join(root, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, text)
}

function listFiles() {
  return readdirSync(root, { recursive: true }).sort()
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ref-lib-clean-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('cleanDeclarations', () => {
  it('removes every declaration file and keeps the runtime and package files', async () => {
    write('index.d.ts')
    write('index.mjs')
    write('components/Tabs/Tabs.d.ts')
    write('components/Toast/ToastChrome.d.ts')
    write('runtime/reference-ui/react/react.d.mts')
    write('runtime/reference-ui/react/react.mjs')
    write('runtime/reference-ui/react/styles.css')
    write('tasty/manifest.d.ts')
    write('tasty/manifest.js')
    write('theme/index.d.ts')
    write('theme/index.mjs')
    write('package.json')

    const removed = await cleanDeclarations(root)

    expect(removed).toBe(6)
    expect(listFiles()).toEqual([
      'components',
      'components/Tabs',
      'components/Toast',
      'index.mjs',
      'package.json',
      'runtime',
      'runtime/reference-ui',
      'runtime/reference-ui/react',
      'runtime/reference-ui/react/react.mjs',
      'runtime/reference-ui/react/styles.css',
      'tasty',
      'tasty/manifest.js',
      'theme',
      'theme/index.mjs',
    ])
  })

  it('treats a missing dist as nothing to clean', async () => {
    rmSync(root, { recursive: true, force: true })
    expect(await cleanDeclarations(root)).toBe(0)
  })
})
