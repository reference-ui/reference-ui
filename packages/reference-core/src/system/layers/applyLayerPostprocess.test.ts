import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { applyLayerPostprocess } from './applyLayerPostprocess'
import { createLayerCssFromContent } from './transform'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-layers-postprocess-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('system/layers/applyLayerPostprocess', () => {
  it('returns undefined when styles.css does not exist', () => {
    const outDir = createTempDir()

    expect(
      applyLayerPostprocess(outDir, {
        name: 'missing-styles',
      } as never)
    ).toBeUndefined()
  })

  it('returns layer css without rewriting the runtime stylesheet when no upstream layers are configured', () => {
    const outDir = createTempDir()
    const styledDir = resolve(outDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const rawCss = '@layer base, tokens;\n@layer tokens { :where(:root,:host) { --color: red; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')

    const result = applyLayerPostprocess(outDir, {
      name: 'local-system',
      layers: [],
    } as never)

    expect(result).toBe(createLayerCssFromContent(rawCss, 'local-system'))
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

    const localLayerCss = createLayerCssFromContent(rawCss, 'local-system')
    const result = applyLayerPostprocess(outDir, {
      name: 'local-system',
      layers: [
        { name: 'upstream-one', css: '@layer upstream-one { .one { color: blue; } }' },
        { name: 'upstream-two' },
        { name: 'upstream-three', css: '  @layer upstream-three { .three { color: green; } }  ' },
      ],
    } as never)

    expect(result).toBe(localLayerCss)
    expect(readFileSync(stylesPath, 'utf-8')).toBe(
      [
        localLayerCss,
        '@layer upstream-one { .one { color: blue; } }',
        '@layer upstream-three { .three { color: green; } }',
      ].join('\n\n')
    )
  })
})
