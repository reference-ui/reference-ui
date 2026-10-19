// Tests for the icons declaration-specifier post-pass, run with
// `node --test scripts/rewrite-declaration-specifiers.test.mjs`: icons has no vitest,
// and this build script needs only node:test. They take temp declaration trees and assert
// rewrites land on shipped files while dangling specifiers are reported.
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { declarationSpecifierProblems, rewriteDeclarationSpecifiers } from './rewrite-declaration-specifiers.mjs'

let root

function write(rel, text) {
  const full = join(root, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, text)
  return full
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ref-icons-rewrite-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('rewriteDeclarationSpecifiers', () => {
  it('gives each extensionless relative specifier the extension of the declaration it names', () => {
    write('dist/types.d.ts', 'export type T = 1\n')
    write('dist/parts/index.d.ts', 'export {}\n')
    write('dist/generated/abc.d.ts', 'export declare const AbcIcon: import("../types").T;\n')
    write('dist/generated/index.d.ts', "export { AbcIcon } from './abc';\n")
    write('dist/index.d.ts', "// export * from './commented';\nexport * from './generated/index';\nexport * from './parts';\n")

    assert.deepEqual(rewriteDeclarationSpecifiers({ packageRoot: root }), { files: 5, filesChanged: 3, rewritten: 4 })
    assert.equal(
      readFileSync(join(root, 'dist/generated/abc.d.ts'), 'utf8'),
      'export declare const AbcIcon: import("../types.js").T;\n',
    )
    assert.equal(readFileSync(join(root, 'dist/generated/index.d.ts'), 'utf8'), "export { AbcIcon } from './abc.js';\n")
    assert.equal(
      readFileSync(join(root, 'dist/index.d.ts'), 'utf8'),
      "// export * from './commented';\nexport * from './generated/index.js';\nexport * from './parts/index.js';\n",
    )
    assert.deepEqual(declarationSpecifierProblems({ packageRoot: root }), [])
  })

  it('leaves an extensionless specifier that names no declaration for the guard to name', () => {
    write('dist/index.d.ts', "export * from './missing';\n")
    assert.deepEqual(rewriteDeclarationSpecifiers({ packageRoot: root }), { files: 1, filesChanged: 0, rewritten: 0 })
    assert.equal(readFileSync(join(root, 'dist/index.d.ts'), 'utf8'), "export * from './missing';\n")
  })
})

describe('declarationSpecifierProblems', () => {
  it('fails on a planted extensionless specifier and clears once it carries its extension', () => {
    write('dist/generated/abc.d.ts', 'export {}\n')
    const planted = write('dist/generated/index.d.ts', "export { AbcIcon } from './abc';\n")
    const problems = declarationSpecifierProblems({ packageRoot: root })
    assert.equal(problems.length, 1)
    assert.match(problems[0], /^dist\/generated\/index\.d\.ts: "\.\/abc" has no file extension/)

    writeFileSync(planted, "export { AbcIcon } from './abc.js';\n")
    assert.deepEqual(declarationSpecifierProblems({ packageRoot: root }), [])
  })

  it('names a specifier with an extension that has no shipped declaration beside it', () => {
    write('dist/index.d.ts', "export * from './missing.js';\n")
    const problems = declarationSpecifierProblems({ packageRoot: root })
    assert.equal(problems.length, 1)
    assert.match(problems[0], /^dist\/index\.d\.ts: "\.\/missing\.js" has no shipped declaration at /)
  })

  it('names a bare @reference-ui specifier in a runtime declaration that icons does not ship', () => {
    const planted = write(
      'dist/runtime/reference-ui/react/types/public/colors.d.ts',
      "import type { PropType } from '@reference-ui/styled/types/prop-type';\n",
    )
    const problems = declarationSpecifierProblems({ packageRoot: root })
    assert.equal(problems.length, 1)
    assert.match(
      problems[0],
      /^dist\/runtime\/reference-ui\/react\/types\/public\/colors\.d\.ts: "@reference-ui\/styled\/types\/prop-type" names a @reference-ui package/,
    )

    writeFileSync(planted, 'export {}\n')
    assert.deepEqual(declarationSpecifierProblems({ packageRoot: root }), [])
  })
})
