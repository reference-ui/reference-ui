import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { postprocessCss } from './postprocess'
import { createPortableStylesheetFromContent } from './transform/createPortableStylesheetFromContent'

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

  it('returns portable css without rewriting the runtime stylesheet when no upstream layers are configured', () => {
    const outDir = createTempDir()
    const styledDir = resolve(outDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const rawCss = '@layer base, tokens;\n@layer tokens { :where(:root,:host) { --color: red; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')

    const result = postprocessCss(outDir, {
      name: 'local-system',
      layers: [],
    } as never)

    expect(result).toBe(createPortableStylesheetFromContent(rawCss, 'local-system'))
    expect(readFileSync(stylesPath, 'utf-8')).toBe(rawCss)
  })

  it('rewrites styles.css in layers mode and appends only upstream layers with css', () => {
    const outDir = createTempDir()
    const styledDir = resolve(outDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const rawCss =
      '@layer base, tokens, utilities;\n@layer tokens { :where(:root, :host) { --color: red; } }\n@layer utilities { .x { color: red; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')

    const localPortableStylesheet = createPortableStylesheetFromContent(rawCss, 'local-system')
    const result = postprocessCss(outDir, {
      name: 'local-system',
      layers: [
        { name: 'upstream-one', css: '@layer upstream-one { .one { color: blue; } }' },
        { name: 'upstream-two' },
        { name: 'upstream-three', css: '  @layer upstream-three { .three { color: green; } }  ' },
      ],
    } as never)

    expect(result).toBe(localPortableStylesheet)
    expect(readFileSync(stylesPath, 'utf-8')).toBe(
      [
        '@layer upstream-one, upstream-three, local-system;',
        localPortableStylesheet,
        '@layer upstream-one { .one { color: blue; } }',
        '@layer upstream-three { .three { color: green; } }',
      ].join('\n\n'),
    )
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
