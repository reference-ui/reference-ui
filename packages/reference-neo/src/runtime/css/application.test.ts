// Runtime application proofs over a real Neo sync with the native compiler.
// It takes a temp project styling with axis shorthands (marginX, marginY,
// paddingX, paddingY) as the vehicle, then asserts the published sheet, the
// runtime artifact, the primitive splitter, and css() naming. Registration
// is module state, so the suite syncs once and registers once up front.

import { readFileSync } from 'node:fs'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createPropSplitter } from '../../primitives/runtime/split.ts'
import { css, registerRuntimeData } from './css.ts'
import { cleanDir } from '../../sync/clean.ts'
import { sync } from '../../sync/index.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => cleanDir(dir)))
})

async function writeProject(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-axis-'))
  tempDirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, content)
  }
  return dir
}

const UI_CONFIG = [
  "import { defineConfig } from '@reference-ui/neo'",
  '',
  'export default defineConfig({',
  "  name: 'axis-test',",
  "  include: ['theme/**/*.{ts,tsx}'],",
  '})',
  '',
].join('\n')

const TOKENS_FILE = [
  "import { tokens } from '@reference-ui/neo'",
  '',
  'tokens({',
  '  colors: {',
  "    brand: { value: '#7c3aed' },",
  '  },',
  '})',
  '',
].join('\n')

const APP_FILE = [
  "import { css } from '@reference-ui/react'",
  '',
  "export const x = css({ marginX: '2r' })",
  "export const y = css({ marginY: '8r' })",
  "export const px = css({ paddingX: '1r' })",
  "export const py = css({ paddingY: '0.5r' })",
  '',
].join('\n')

const AXIS_PROPS = ['marginX', 'marginY', 'paddingX', 'paddingY'] as const

let styles = ''
let artifact: NativeRuntimeArtifact | undefined

beforeAll(async () => {
  const dir = await writeProject({
    'ui.config.ts': UI_CONFIG,
    'theme/tokens.ts': TOKENS_FILE,
    'theme/app.ts': APP_FILE,
  })
  const { outDir } = await sync(dir)
  styles = readFileSync(join(outDir, 'styled', 'styles.css'), 'utf-8')
  const dataUrl = pathToFileURL(join(outDir, 'styled', 'runtime-data.mjs')).href
  const published = (await import(dataUrl)) as {
    systemName: string
    runtimeData: NativeRuntimeArtifact
  }
  artifact = published.runtimeData
  registerRuntimeData(published.systemName, published.runtimeData)
}, 120_000)

function stylePropNames(): readonly string[] {
  if (artifact === undefined) throw new Error('axis setup did not run')
  return artifact.stylePropNames
}

describe('axis shorthands', () => {
  it('compile to single logical declarations in the published sheet', () => {
    expect(styles).toContain('margin-inline: calc(2 * var(--spacing-root));')
    expect(styles).toContain('margin-block: calc(8 * var(--spacing-root));')
    expect(styles).toContain('padding-inline: var(--spacing-root);')
    expect(styles).toContain('padding-block: calc(0.5 * var(--spacing-root));')
    expect(styles).not.toContain('margin-top:')
    expect(styles).not.toContain('padding-left:')
  })

  it('ride the artifact style prop names and namer aliases', () => {
    if (artifact === undefined) throw new Error('axis setup did not run')
    for (const prop of AXIS_PROPS) {
      expect(stylePropNames()).toContain(prop)
    }
    expect(artifact.namer.aliases['marginX']).toBe('marginInline')
    expect(artifact.namer.aliases['marginY']).toBe('marginBlock')
    expect(artifact.namer.aliases['paddingX']).toBe('paddingInline')
    expect(artifact.namer.aliases['paddingY']).toBe('paddingBlock')
  })

  it('split onto style resolution, never onto the element', () => {
    const split = createPropSplitter(stylePropNames())
    const props: Record<string, unknown> = {
      marginX: '2r',
      marginY: '8r',
      paddingX: '1r',
      paddingY: '0.5r',
    }
    const { styleProps, elementProps } = split(props)
    expect(styleProps).toEqual(props)
    expect(elementProps).toEqual({})
  })

  it('name backed classes through css()', () => {
    expect(css({ marginX: '2r' })).toBe('axis-test__mx_2r')
    expect(css({ marginY: '8r' })).toBe('axis-test__my_8r')
    expect(css({ paddingX: '1r' })).toBe('axis-test__px_1r')
    expect(css({ paddingY: '0.5r' })).toBe('axis-test__py_0.5r')
    // Every named class has its rule in the published sheet: no ghosts.
    for (const stem of ['mx_2r', 'my_8r', 'px_1r', 'py_0']) {
      expect(styles).toContain(`axis-test__${stem}`)
    }
  })
})
