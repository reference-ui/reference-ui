// MDX fragment templates for bench repos.
// They take an index and emit a real top-level font() fragment plus a
// fence-only decoy that must never collect. Names are index-derived, so the
// bytes are deterministic across runs; the fragment's top-level import is the
// needle the MDX-scoped scan matches, and the decoy proves the fence strip.

const FENCE = '```'

export function mdxFragment(index: number): string {
  const name = `bench-mdx-${index}`
  return [
    "import { font } from '@reference-ui/system'",
    '',
    `export const benchMdx${index} = font('${name}', {`,
    `  value: '"Bench MDX ${index}", serif',`,
    `  fontFace: { src: 'url(/fonts/${name}.woff2) format("woff2")' },`,
    `  weights: { normal: '400', bold: '700' },`,
    '})',
    '',
    `# Bench MDX ${index}`,
    '',
    `${FENCE}ts`,
    "import { font } from '@reference-ui/system'   // fence decoy: must NOT match",
    `font('${name}-fence', { value: 'Fence', fontFace: { src: 'url(/f.woff2)' }, weights: { normal: '400' } })`,
    FENCE,
    '',
  ].join('\n')
}

export function mdxDecoy(index: number): string {
  const name = `bench-decoy-${index}`
  return [
    `# Bench decoy ${index}`,
    '',
    `${FENCE}ts`,
    "import { font } from '@reference-ui/system'",
    `font('${name}', { value: 'Decoy', fontFace: { src: 'url(/d.woff2)' }, weights: { normal: '400' } })`,
    FENCE,
    '',
  ].join('\n')
}
