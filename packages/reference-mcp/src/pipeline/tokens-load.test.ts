import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadMcpTokens } from './tokens'

describe('loadMcpTokens (Neo fragment evaluation)', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ref-mcp-tokens-'))
    mkdirSync(join(dir, 'src'), { recursive: true })
    writeFileSync(
      join(dir, 'src', 'tokens.ts'),
      `import { tokens } from '@reference-ui/neo'\n\ntokens({\n  colors: {\n    localPublic: { value: '#ffffff' },\n    _private: {\n      localSecret: { value: '#aaaaaa' },\n    },\n  },\n})\n`
    )
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('evaluates local fragments and upstream extends with the _private boundary', async () => {
    const tokens = await loadMcpTokens(dir, {
      name: 'smoke',
      include: ['src/**/*.{ts,tsx}'],
      extends: [
        {
          name: 'upstream',
          fragment:
            'tokens({ colors: { upstreamPublic: { value: "#222222" }, ' +
            '_private: { upstreamSecret: { value: "#000000" } } } })',
        },
      ],
    })

    const paths = tokens.map(token => token.path)
    expect(paths).toContain('colors.upstreamPublic')
    expect(paths).toContain('colors.localPublic')
    expect(paths).toContain('colors._private.localSecret')
    expect(paths).not.toContain('colors._private.upstreamSecret')
    expect(
      tokens.find(token => token.path === 'colors.upstreamPublic')
    ).toMatchObject({ category: 'colors', value: '#222222' })
  })

  it('returns local tokens without extends', async () => {
    const tokens = await loadMcpTokens(dir, {
      name: 'smoke',
      include: ['src/**/*.{ts,tsx}'],
    })

    expect(tokens.map(token => token.path).sort()).toEqual([
      'colors._private.localSecret',
      'colors.localPublic',
    ])
  })
})
