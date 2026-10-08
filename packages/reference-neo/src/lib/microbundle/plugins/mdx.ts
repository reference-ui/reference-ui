// esbuild loader for `.mdx` fragment sources in Neo microbundle builds.
// It takes an `.mdx` entry and emits the `@rspress/mdx-rs`-compiled JSX module,
// so sync can execute top-level collector calls (`font()`, `tokens()`, …) that
// authors write in MDX. The MDX content component never runs during a build, so
// the react stub only has to resolve the bindings mdx-rs emits, not execute them.
// On a parse failure mdx-rs resolves with an empty fallback module and prints
// the real error to the native stderr; this plugin detects the fallback shape
// and throws a named diagnostic instead of silently shipping `export {}` — a
// deliberate divergence from the legacy transform (captain ruling R5).

import { readFileSync } from 'node:fs'
import type * as esbuild from 'esbuild'
import type { Output } from '@rspress/mdx-rs'
import { compile } from '@rspress/mdx-rs'

const MDX_FILTER = /\.mdx$/

// The exact module mdx-rs emits for a parse failure (and for a genuinely empty
// document). Content with bytes plus this shape means the compiler failed; the
// empty-document case is excluded by the trim guard below, exactly like legacy.
const FALLBACK_SHAPE =
  /^import \{[^\n]*\} from "@mdx-js\/react";\s*\nfunction _createMdxContent/m

function hasNonEmptyFrontmatter(frontmatter: string): boolean {
  try {
    const parsed = JSON.parse(frontmatter) as Record<string, unknown>
    return Object.keys(parsed).length > 0
  } catch {
    return false
  }
}

function isSilentParseFailure(value: string, result: Output): boolean {
  if (value.trim().length === 0) return false
  if (result.html.length > 0) return false
  if (hasNonEmptyFrontmatter(result.frontmatter)) return false
  return FALLBACK_SHAPE.test(result.code)
}

async function compileMdx(filePath: string): Promise<string> {
  const value = readFileSync(filePath, 'utf-8')
  const result = await compile({ value, filepath: filePath, development: false, root: '' })
  if (isSilentParseFailure(value, result)) {
    throw new Error(
      `mdx compile failed for ${filePath}: @rspress/mdx-rs emitted its empty ` +
        `fallback module — the parse error is on the native stderr`
    )
  }
  return result.code
}

/**
 * esbuild plugin that compiles `.mdx` entries through `@rspress/mdx-rs` and
 * hands the emitted JSX to esbuild. It is inert for any build without an
 * `.mdx` entry, so the microbundle seam registers it unconditionally.
 */
export function mdxPlugin(): esbuild.Plugin {
  return {
    name: 'mdx',
    setup(build) {
      build.onLoad({ filter: MDX_FILTER }, async args => ({
        contents: await compileMdx(args.path),
        loader: 'jsx',
      }))
    },
  }
}
