import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  declarationSpecifierProblems,
  rewriteDeclarationSpecifiers,
  rewriteSpecifierText,
} from './rewrite-declaration-specifiers.mjs'

let root

function write(rel, text) {
  const full = join(root, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, text)
  return full
}

// The shipped runtime files and declarations that materialize-runtime writes.
function shipRuntime() {
  write('dist/runtime/reference-ui/react/react.mjs', 'export {}\n')
  write('dist/runtime/reference-ui/react/react.d.mts', 'export {}\n')
  write('dist/runtime/reference-ui/styled/index.d.ts', 'export {}\n')
  write('dist/runtime/reference-ui/types/types.mjs', 'export {}\n')
  write('dist/runtime/reference-ui/types/types.d.mts', 'export {}\n')
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ref-lib-rewrite-'))
  shipRuntime()
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('rewriteDeclarationSpecifiers', () => {
  it('repoints bare react, styled and types specifiers at the shipped runtime', () => {
    write(
      'dist/components/Tabs/Tabs.d.ts',
      [
        "import type { PrimitiveProps } from '@reference-ui/react';",
        'export type TabsTrigger = Omit<import("@reference-ui/react").StyleProps, "value">;',
        'export declare const X: import("../../../.reference-ui/react/react.mjs").RecipeVariantProps;',
        "export * from '@reference-ui/icons';",
        "import * as React from 'react';",
        '',
      ].join('\n'),
    )
    write('dist/components/Overlay/parts/Trigger.d.ts', "export type * from '@reference-ui/styled';\n")
    write('dist/components/Reference/Reference.d.ts', "import { type ReferenceComponentProps } from '@reference-ui/types';\n")

    // Six declaration files: three shipped runtime companions plus three fixtures.
    const result = rewriteDeclarationSpecifiers({ packageRoot: root })
    expect(result).toEqual({ files: 6, filesChanged: 3, rewritten: 5 })

    expect(readFileSync(join(root, 'dist/components/Tabs/Tabs.d.ts'), 'utf8')).toBe(
      [
        "import type { PrimitiveProps } from '../../runtime/reference-ui/react/react.mjs';",
        'export type TabsTrigger = Omit<import("../../runtime/reference-ui/react/react.mjs").StyleProps, "value">;',
        'export declare const X: import("../../runtime/reference-ui/react/react.mjs").RecipeVariantProps;',
        "export * from '@reference-ui/icons';",
        "import * as React from 'react';",
        '',
      ].join('\n'),
    )
    expect(readFileSync(join(root, 'dist/components/Overlay/parts/Trigger.d.ts'), 'utf8')).toBe(
      "export type * from '../../../runtime/reference-ui/styled/index.js';\n",
    )
    expect(readFileSync(join(root, 'dist/components/Reference/Reference.d.ts'), 'utf8')).toBe(
      "import { type ReferenceComponentProps } from '../../runtime/reference-ui/types/types.mjs';\n",
    )
    expect(declarationSpecifierProblems({ packageRoot: root })).toEqual([])
  })

  it('leaves specifiers that already resolve in the tarball untouched', () => {
    const index = "export { baseSystem } from '../.reference-ui/system/baseSystem.mjs';\nexport { CheckIcon } from '@reference-ui/icons';\nexport * from './components/Tabs/index';\n"
    write('dist/index.d.ts', index)
    write('dist/runtime/reference-ui/react/react.d.mts', "export type * from '../styled/index.js';\n")

    const result = rewriteDeclarationSpecifiers({ packageRoot: root })
    expect(result.rewritten).toBe(0)
    expect(readFileSync(join(root, 'dist/index.d.ts'), 'utf8')).toBe(index)
  })

  it('is idempotent: a second pass over rewritten output changes nothing', () => {
    write('dist/components/Tabs/Tabs.d.ts', "import type { P } from '@reference-ui/react';\n")
    rewriteDeclarationSpecifiers({ packageRoot: root })
    const once = readFileSync(join(root, 'dist/components/Tabs/Tabs.d.ts'), 'utf8')

    // Four declaration files: three shipped runtime declarations plus Tabs.d.ts.
    expect(rewriteDeclarationSpecifiers({ packageRoot: root })).toEqual({
      files: 4,
      filesChanged: 0,
      rewritten: 0,
    })
    expect(readFileSync(join(root, 'dist/components/Tabs/Tabs.d.ts'), 'utf8')).toBe(once)
  })

  it('fails on a guarded subpath with no shipped target instead of shipping it', () => {
    write('dist/components/Odd/Odd.d.ts', "export type T = import('@reference-ui/styled/unknown').X;\n")
    expect(() => rewriteDeclarationSpecifiers({ packageRoot: root })).toThrow(
      /no shipped target for "@reference-ui\/styled\/unknown"/,
    )
  })

  it('fails when a generated .reference-ui path has no shipped declaration', () => {
    write('dist/components/Odd/Odd.d.ts', "export type T = import('../../../.reference-ui/react/missing.mjs').X;\n")
    expect(() => rewriteDeclarationSpecifiers({ packageRoot: root })).toThrow(/has no shipped declaration/)
  })

  it('fails when a guarded package target is absent from the runtime copy', () => {
    write('dist/components/Reference/Reference.d.ts', "import type { R } from '@reference-ui/types';\n")
    rmSync(join(root, 'dist/runtime/reference-ui/types/types.d.mts'))
    expect(() => rewriteDeclarationSpecifiers({ packageRoot: root })).toThrow(/has no shipped declaration/)
  })

  it('fails when a bare target ships its declaration but not the runtime file tasty maps', () => {
    write('dist/components/Reference/Reference.d.ts', "import type { R } from '@reference-ui/types';\n")
    rmSync(join(root, 'dist/runtime/reference-ui/types/types.mjs'))
    expect(() => rewriteDeclarationSpecifiers({ packageRoot: root })).toThrow(
      /has no shipped file tasty can map to it/,
    )
  })

  it('gives each extensionless relative specifier the extension of the declaration it names', () => {
    write('dist/types.d.ts', 'export type T = 1\n')
    write('dist/components/Overlay/index.d.ts', 'export {}\n')
    write('dist/components/Overlay/parts/Trigger.d.ts', 'export {}\n')
    write('dist/components/Tabs/Motion.d.mts', 'export {}\n')
    write('dist/components/Tabs/Motion.mjs', 'export {}\n')
    write(
      'dist/components/Tabs/Tabs.d.ts',
      [
        "import type { T } from '../../types';",
        "export * from '../Overlay';",
        "export * from '../Overlay/parts/Trigger';",
        "export type * from './Motion';",
        "export type U = import('../../types').T;",
        '',
      ].join('\n'),
    )

    // Three shipped runtime declarations plus types, Overlay, Trigger, Motion and Tabs.
    expect(rewriteDeclarationSpecifiers({ packageRoot: root })).toEqual({ files: 8, filesChanged: 1, rewritten: 5 })
    expect(readFileSync(join(root, 'dist/components/Tabs/Tabs.d.ts'), 'utf8')).toBe(
      [
        "import type { T } from '../../types.js';",
        "export * from '../Overlay/index.js';",
        "export * from '../Overlay/parts/Trigger.js';",
        "export type * from './Motion.mjs';",
        "export type U = import('../../types.js').T;",
        '',
      ].join('\n'),
    )
    expect(declarationSpecifierProblems({ packageRoot: root })).toEqual([])
  })

  it('leaves an extensionless specifier that names no declaration for the guard to name', () => {
    write('dist/components/Odd/Odd.d.ts', "export * from './missing';\n")
    // Three shipped runtime declarations plus Odd.d.ts.
    expect(rewriteDeclarationSpecifiers({ packageRoot: root })).toEqual({ files: 4, filesChanged: 0, rewritten: 0 })
    expect(declarationSpecifierProblems({ packageRoot: root })).toEqual([
      expect.stringMatching(/^dist\/components\/Odd\/Odd\.d\.ts: "\.\/missing" has no file extension/),
    ])
  })
})

describe('declarationSpecifierProblems', () => {
  it('names a planted relative specifier that ships no file, and clears once it is removed', () => {
    const planted = write('dist/components/Odd/Odd.d.ts', "export type T = import('./missing.mjs').X;\n")
    const problems = declarationSpecifierProblems({ packageRoot: root })
    expect(problems).toEqual([
      expect.stringMatching(/^dist\/components\/Odd\/Odd\.d\.ts: "\.\/missing\.mjs" has no shipped declaration at /),
    ])

    rmSync(planted)
    expect(declarationSpecifierProblems({ packageRoot: root })).toEqual([])
  })

  it('flags a TypeScript extension, ignores commented specifiers, and accepts a .js name with its .d.ts', () => {
    write(
      'dist/components/Odd/Odd.d.ts',
      [
        "import type { A } from './local.ts';",
        "// import('./commented-out');",
        "export type B = import('./ok.js').B;",
        '',
      ].join('\n'),
    )
    write('dist/components/Odd/ok.d.ts', 'export type B = 1\n')
    expect(declarationSpecifierProblems({ packageRoot: root })).toEqual([
      expect.stringMatching(/"\.\/local\.ts" keeps a TypeScript extension/),
    ])
  })

  it('accepts a root-shipped baseSystem payload and an index-directory import with its extension', () => {
    write('.reference-ui/system/baseSystem.mjs', 'export {}\n')
    write('.reference-ui/system/baseSystem.d.mts', 'export {}\n')
    write('dist/index.d.ts', "export { baseSystem } from '../.reference-ui/system/baseSystem.mjs';\nexport * from './parts/index.js';\n")
    write('dist/parts/index.d.ts', 'export {}\n')
    expect(declarationSpecifierProblems({ packageRoot: root })).toEqual([])
  })

  it('fails on a planted extensionless specifier, even one that resolves, and passes once it carries its extension', () => {
    write('dist/components/Tabs/Trigger.d.ts', 'export {}\n')
    const planted = write('dist/components/Tabs/Tabs.d.ts', "export * from './Trigger';\n")
    expect(declarationSpecifierProblems({ packageRoot: root })).toEqual([
      expect.stringMatching(/^dist\/components\/Tabs\/Tabs\.d\.ts: "\.\/Trigger" has no file extension/),
    ])

    writeFileSync(planted, "export * from './Trigger.js';\n")
    expect(declarationSpecifierProblems({ packageRoot: root })).toEqual([])
  })
})

describe('rewriteSpecifierText', () => {
  const fromFile = '/pkg/dist/components/Tabs/Tabs.d.ts'
  const resolve = (specifier) => (specifier === '@reference-ui/react' ? './runtime/reference-ui/react/react.mjs' : null)

  it('covers every specifier position a declaration uses', () => {
    const source = [
      "import '@reference-ui/react';",
      'import x from "@reference-ui/react";',
      'export * as ns from "@reference-ui/react";',
      'type A = typeof import("@reference-ui/react");',
      "declare module '@reference-ui/react' {}",
      "const r = require('@reference-ui/react');",
      '/// <reference types="@reference-ui/react" />',
      'const unrelated = "@reference-ui/react";',
      "// import x from '@reference-ui/react';",
      '',
    ].join('\n')

    const { text, count } = rewriteSpecifierText(source, fromFile, resolve)
    expect(count).toBe(7)
    expect(text.split('./runtime/reference-ui/react/react.mjs').length - 1).toBe(7)
    expect(text).toContain('const unrelated = "@reference-ui/react";')
    expect(text).toContain("// import x from '@reference-ui/react';")
  })
})
