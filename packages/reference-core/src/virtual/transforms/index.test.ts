import { afterEach, describe, expect, it, vi } from 'vitest'

async function importTransformsModule() {
  vi.resetModules()

  const rewriteCvaImports = vi.fn((source: string) => `${source}\n// cva`)
  const rewriteCssImports = vi.fn((source: string) => `${source}\n// css`)
  const applyResponsiveStyles = vi.fn((source: string) => `${source}\n// responsive`)

  vi.doMock('./rewrite-cva-imports', () => ({ rewriteCvaImports }))
  vi.doMock('./rewrite-css-imports', () => ({ rewriteCssImports }))
  vi.doMock('./apply-responsive-styles', () => ({ applyResponsiveStyles }))

  const mod = await import('./index')

  return {
    ...mod,
    rewriteCvaImports,
    rewriteCssImports,
    applyResponsiveStyles,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./rewrite-cva-imports')
  vi.doUnmock('./rewrite-css-imports')
  vi.doUnmock('./apply-responsive-styles')
  vi.restoreAllMocks()
})

describe('virtual/transforms', () => {
  it('applies responsive lowering after import rewrites for TS sources', async () => {
    const {
      applyTransforms,
      rewriteCvaImports,
      rewriteCssImports,
      applyResponsiveStyles,
    } = await importTransformsModule()

    const result = await applyTransforms({
      sourcePath: '/workspace/app/src/card.tsx',
      relativePath: 'src/card.tsx',
      content: "import { css, recipe } from '@reference-ui/react'\nconst x = recipe({})\n",
    })

    expect(rewriteCvaImports).toHaveBeenCalledWith(
      "import { css, recipe } from '@reference-ui/react'\nconst x = recipe({})\n",
      'src/card.tsx',
    )
    expect(rewriteCssImports).toHaveBeenCalledWith(
      "import { css, recipe } from '@reference-ui/react'\nconst x = recipe({})\n\n// cva",
      'src/card.tsx',
    )
    expect(applyResponsiveStyles).toHaveBeenCalledWith(
      "import { css, recipe } from '@reference-ui/react'\nconst x = recipe({})\n\n// cva\n// css",
      'src/card.tsx',
    )
    expect(result).toEqual({
      content:
        "import { css, recipe } from '@reference-ui/react'\nconst x = recipe({})\n\n// cva\n// css\n// responsive",
      extension: undefined,
      transformed: true,
    })
  })

  it('skips native transforms for files without the runtime marker', async () => {
    const {
      applyTransforms,
      rewriteCvaImports,
      rewriteCssImports,
      applyResponsiveStyles,
    } = await importTransformsModule()

    const result = await applyTransforms({
      sourcePath: '/workspace/app/src/card.tsx',
      relativePath: 'src/card.tsx',
      content: 'export const card = 1\n',
    })

    expect(rewriteCvaImports).not.toHaveBeenCalled()
    expect(rewriteCssImports).not.toHaveBeenCalled()
    expect(applyResponsiveStyles).not.toHaveBeenCalled()
    expect(result).toEqual({
      content: 'export const card = 1\n',
      extension: undefined,
      transformed: false,
    })
  })
})