// End to end tests for Neo fragment evaluation over temp project trees.
// They take fixture author files and assert the merged spec plus provenance.
// Upstream bundles thread through extends while local files win conflicts.

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ReferenceUIConfig } from '../../config/types.ts'
import { evaluateFragments } from './index.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

async function writeProject(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-fragments-'))
  tempDirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, content)
  }
  return dir
}

function configWith(overrides: Partial<ReferenceUIConfig> = {}): ReferenceUIConfig {
  return { name: 'test-system', include: ['theme/**/*.{ts,tsx}'], ...overrides }
}

const TOKENS_FILE = [
  "import { tokens } from '@reference-ui/neo'",
  '',
  'tokens({',
  '  colors: {',
  "    brand: { value: '#0066cc' },",
  "    text: { value: '#111111', dark: '#f5f5f5' },",
  '  },',
  '})',
  '',
].join('\n')

const MORE_FILE = [
  "import { tokens, keyframes, font, globalCss, extendPattern } from '@reference-ui/neo'",
  '',
  'tokens({',
  '  spacing: {',
  "    sm: { value: '0.5rem' },",
  '  },',
  '})',
  '',
  'keyframes({',
  '  fadeIn: {',
  "    '0%': { opacity: '0' },",
  "    '100%': { opacity: '1' },",
  '  },',
  '})',
  '',
  "font('sans', {",
  "  value: '\"Inter\", sans-serif',",
  "  fontFace: { src: 'url(/fonts/inter.woff2)' },",
  "  weights: { normal: '400' },",
  '})',
  '',
  'globalCss({',
  "  ':root': { '--brand': '#0066cc' },",
  '})',
  '',
  'extendPattern({',
  '  properties: {',
  "    highlight: { type: 'boolean' },",
  '  },',
  '  transform: (props) => (props.highlight ? { outline: \'2px solid red\' } : {}),',
  '})',
  '',
].join('\n')

const PLAIN_FILE = [
  'export const notAFragments = 1',
  '',
].join('\n')

describe('evaluateFragments spec merge', () => {
  it('merges local author calls into the frozen spec shape', async () => {
    const dir = await writeProject({
      'theme/tokens.ts': TOKENS_FILE,
      'theme/more.ts': MORE_FILE,
      'theme/plain.ts': PLAIN_FILE,
    })

    const spec = await evaluateFragments(dir, configWith())

    expect(spec.schemaVersion).toBe(1)
    expect(spec.profile).toBe('reference-ui')
    expect(spec.name).toBe('test-system')
    expect(spec.tokens).toEqual({
      colors: {
        brand: { value: '#0066cc' },
        text: { value: '#111111', dark: '#f5f5f5' },
      },
      spacing: { sm: { value: '0.5rem' } },
      fontWeights: { sans: { normal: { value: '400' } } },
    })
    expect(spec.keyframes).toEqual({
      fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
    })
    expect(spec.fonts).toEqual({
      sans: {
        value: '"Inter", sans-serif',
        fontFace: { src: 'url(/fonts/inter.woff2)' },
        weights: { normal: '400' },
      },
    })
    expect(spec.globalCss).toEqual([
      { source: 'theme/more.ts', rules: { ':root': { '--brand': '#0066cc' } } },
    ])
    expect(spec.recipes).toEqual({})
    expect(spec.staticCss).toEqual({})
  })

  it('carries config staticCss into the evaluated spec', async () => {
    const dir = await writeProject({ 'theme/tokens.ts': TOKENS_FILE })

    const spec = await evaluateFragments(
      dir,
      configWith({ staticCss: { color: ['brand'], '_hover:color': ['text'] } })
    )

    expect(spec.staticCss).toEqual({ color: ['brand'], '_hover:color': ['text'] })
  })

  it('threads upstream fragments through extends with local winning conflicts', async () => {
    const dir = await writeProject({ 'theme/tokens.ts': TOKENS_FILE })

    const spec = await evaluateFragments(
      dir,
      configWith({
        extends: [
          {
            name: 'upstream',
            fragment: [
              "tokens({ colors: { brand: { value: '#000000' }, up: { value: '#ffffff' } } })",
              "globalCss({ ':root': { '--up': 'yes' } })",
            ].join('\n'),
          },
        ],
      })
    )

    expect(spec.tokens).toEqual({
      colors: {
        brand: { value: '#0066cc' },
        up: { value: '#ffffff' },
        text: { value: '#111111', dark: '#f5f5f5' },
      },
    })
    expect(spec.globalCss).toEqual([])
  })
})

describe('evaluateFragments font weight tokens', () => {
  const FONTS_FILE = [
    "import { font } from '@reference-ui/neo'",
    '',
    "font('sans', {",
    "  value: '\"Inter\", sans-serif',",
    "  fontFace: { src: 'url(/fonts/inter.woff2)' },",
    "  weights: { thin: '200', normal: '400', bold: '700' },",
    '})',
    '',
    "font('mono', {",
    "  value: '\"JetBrains Mono\", monospace',",
    "  fontFace: { src: 'url(/fonts/mono.woff2)' },",
    "  weights: { normal: '393' },",
    '})',
    '',
  ].join('\n')

  it('derives fontWeights tokens from every registered family', async () => {
    const dir = await writeProject({ 'theme/fonts.ts': FONTS_FILE })

    const spec = await evaluateFragments(dir, configWith())

    expect(spec.tokens).toEqual({
      fontWeights: {
        sans: { thin: { value: '200' }, normal: { value: '400' }, bold: { value: '700' } },
        mono: { normal: { value: '393' } },
      },
    })
  })

  it('lets font-derived weights win over author tokens on the same leaf', async () => {
    const dir = await writeProject({
      'theme/fonts.ts': FONTS_FILE,
      'theme/tokens.ts': [
        "import { tokens } from '@reference-ui/neo'",
        '',
        'tokens({',
        '  fontWeights: {',
        "    sans: { normal: { value: '999' }, light: { value: '300' } },",
        '  },',
        '})',
        '',
      ].join('\n'),
    })

    const spec = await evaluateFragments(dir, configWith())

    // Core order: font tokens extend last, so the registry wins the
    // collision while the author-only leaf survives the deep merge.
    expect(spec.tokens).toEqual({
      fontWeights: {
        sans: {
          thin: { value: '200' },
          normal: { value: '400' },
          bold: { value: '700' },
          light: { value: '300' },
        },
        mono: { normal: { value: '393' } },
      },
    })
  })

  it('emits no fontWeights subtree when no family registers weights', async () => {
    const dir = await writeProject({ 'theme/tokens.ts': TOKENS_FILE })

    const spec = await evaluateFragments(dir, configWith())

    expect(spec.tokens).not.toHaveProperty('fontWeights')
  })
})

describe('evaluateFragments provenance', () => {
  it('records relative sources with kinds and keys', async () => {
    const dir = await writeProject({
      'theme/tokens.ts': TOKENS_FILE,
      'theme/more.ts': MORE_FILE,
    })

    const spec = await evaluateFragments(dir, configWith())

    expect(spec.provenance).toHaveLength(6)
    expect(spec.provenance).toContainEqual({
      source: 'theme/tokens.ts',
      kind: 'tokens',
      keys: ['colors.brand', 'colors.text'],
    })
    expect(spec.provenance).toContainEqual({
      source: 'theme/more.ts',
      kind: 'tokens',
      keys: ['spacing.sm'],
    })
    expect(spec.provenance).toContainEqual({ source: 'theme/more.ts', kind: 'fonts', keys: ['sans'] })
    expect(spec.provenance).toContainEqual({
      source: 'theme/more.ts',
      kind: 'keyframes',
      keys: ['fadeIn'],
    })
    expect(spec.provenance).toContainEqual({ source: 'theme/more.ts', kind: 'globalCss' })
    expect(spec.provenance).toContainEqual({ source: 'theme/more.ts', kind: 'fragment' })
  })

  it('cites upstream system names for upstream fragments', async () => {
    const dir = await writeProject({ 'theme/tokens.ts': TOKENS_FILE })

    const spec = await evaluateFragments(
      dir,
      configWith({
        extends: [{ name: 'upstream', fragment: "tokens({ colors: { up: { value: '#fff' } } })" }],
      })
    )

    expect(spec.provenance).toContainEqual({
      source: 'upstream',
      kind: 'tokens',
      keys: ['colors.up'],
    })
  })
})
