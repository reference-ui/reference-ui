import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PANDA_GLOBAL_CSS_FILENAME, postprocessCss } from './index'
import { createPortableResetStylesheet, createRuntimeResetStylesheet } from '../reset'
import { createPortableStylesheetFromContent } from '../transform/createPortableStylesheetFromContent'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-css-postprocess-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('system/css/postprocess', () => {
  it('returns undefined when styles.css does not exist', () => {
    const outDir = createTempDir()

    expect(
      postprocessCss(outDir, {
        name: 'missing-styles',
      } as never),
    ).toBeUndefined()
  })

  it('injects the controlled reset into raw runtime css and portable css when normalizeCss is enabled', () => {
    const outDir = createTempDir()
    const styledDir = resolve(outDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const rawCss = '@layer base, tokens;\n@layer tokens { :where(:root,:host) { --color: red; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')

    const result = postprocessCss(outDir, {
      name: 'local-system',
      normalizeCss: true,
    } as never)

    expect(result).toBe(
      [
        createPortableResetStylesheet('local-system'),
        createPortableStylesheetFromContent(rawCss, 'local-system'),
      ].join('\n\n'),
    )
    expect(readFileSync(stylesPath, 'utf-8')).toBe(
      [createRuntimeResetStylesheet(), rawCss].join('\n\n'),
    )
  })

  it('demotes Panda globalCss output into a lower-priority global layer before postprocessing', () => {
    const outDir = createTempDir()
    const styledDir = resolve(outDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const globalStylesPath = resolve(styledDir, PANDA_GLOBAL_CSS_FILENAME)
    const rawCss = [
      '@layer base, tokens, utilities;',
      '@layer base { .ref-code { color: hotpink; } }',
      '@layer tokens { :where(:root,:host) { --color: red; } }',
      '@layer utilities { .c_code { color: var(--color); } }',
    ].join('\n')
    const globalCss = '@layer base { .ref-code { color: hotpink; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')
    writeFileSync(globalStylesPath, globalCss, 'utf-8')

    const result = postprocessCss(outDir, {
      name: 'local-system',
      normalizeCss: false,
    } as never)

    const demotedCss = [
      '@layer global, base, tokens, utilities;',
      '@layer global { .ref-code { color: hotpink; } }',
      '@layer tokens { :where(:root,:host) { --color: red; } }',
      '@layer utilities { .c_code { color: var(--color); } }',
    ].join('\n')

    expect(result).toBe(createPortableStylesheetFromContent(demotedCss, 'local-system'))
    expect(readFileSync(stylesPath, 'utf-8')).toBe(demotedCss)
  })

  it('throws when Panda global.css no longer matches the combined styles.css base contract', () => {
    const outDir = createTempDir()
    const styledDir = resolve(outDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const globalStylesPath = resolve(styledDir, PANDA_GLOBAL_CSS_FILENAME)

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, '@layer base, tokens;\n@layer base { .x { color: blue; } }', 'utf-8')
    writeFileSync(globalStylesPath, '@layer base { .x { color: red; } }', 'utf-8')

    expect(() =>
      postprocessCss(outDir, {
        name: 'local-system',
        normalizeCss: false,
      } as never),
    ).toThrow('Panda global.css contract changed: expected styles.css base layer to match global.css exactly')
  })

  it('leaves raw runtime css untouched when normalizeCss is false and no upstream css is configured', () => {
    const outDir = createTempDir()
    const styledDir = resolve(outDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const rawCss = '@layer base, tokens;\n@layer tokens { :where(:root,:host) { --color: red; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')

    const result = postprocessCss(outDir, {
      name: 'local-system',
      normalizeCss: false,
      extends: [],
      layers: [],
    } as never)

    expect(result).toBe(createPortableStylesheetFromContent(rawCss, 'local-system'))
    expect(readFileSync(stylesPath, 'utf-8')).toBe(rawCss)
  })

  it('returns and writes the assembled stylesheet when upstream extends or layers expose css', () => {
    const outDir = createTempDir()
    const styledDir = resolve(outDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const rawCss =
      '@layer base, tokens, utilities;\n@layer tokens { :where(:root, :host) { --color: red; } }\n@layer utilities { .x { color: red; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')

    const localPortableStylesheet = [
      createPortableResetStylesheet('local-system'),
      createPortableStylesheetFromContent(rawCss, 'local-system'),
    ].join('\n\n')
    const result = postprocessCss(outDir, {
      name: 'local-system',
      normalizeCss: true,
      extends: [
        { name: 'upstream-extend', css: '@layer upstream-extend { .extend { color: purple; } }' },
      ],
      layers: [
        { name: 'upstream-one', css: '@layer upstream-one { .one { color: blue; } }' },
        { name: 'upstream-two' },
        { name: 'upstream-three', css: '  @layer upstream-three { .three { color: green; } }  ' },
      ],
    } as never)

    const assembledStylesheet = [
      '@layer upstream-extend, upstream-one, upstream-three, local-system;',
      localPortableStylesheet,
      '@layer upstream-extend { .extend { color: purple; } }',
      '@layer upstream-one { .one { color: blue; } }',
      '@layer upstream-three { .three { color: green; } }',
    ].join('\n\n')

    expect(result).toBe(assembledStylesheet)
    expect(readFileSync(stylesPath, 'utf-8')).toBe(assembledStylesheet)
  })

  it('produces identical result and file content on rerun with same inputs', () => {
    const outDir = createTempDir()
    const styledDir = resolve(outDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const rawCss =
      '@layer base, tokens, utilities;\n@layer tokens { :where(:root, :host) { --color: red; } }\n@layer utilities { .x { color: red; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')

    const config = {
      name: 'local-system',
      normalizeCss: true,
      layers: [
        { name: 'upstream-one', css: '@layer upstream-one { .one { color: blue; } }' },
      ],
    } as never

    const first = postprocessCss(outDir, config)
    const firstFile = readFileSync(stylesPath, 'utf-8')
    writeFileSync(stylesPath, rawCss, 'utf-8')
    const second = postprocessCss(outDir, config)
    const secondFile = readFileSync(stylesPath, 'utf-8')

    expect(second).toBe(first)
    expect(secondFile).toBe(firstFile)
  })
})