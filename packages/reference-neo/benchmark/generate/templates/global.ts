// Global-styles template for bench repos.
// It takes nothing and emits the one globalCss() fragment file.
// A single :root rule keeps theme shape constant while style files carry the load.

export function globalFile(): string {
  return [
    "import { globalCss } from '@reference-ui/neo'",
    '',
    'globalCss({',
    "  ':root': { '--bench-root': '0.25rem', containerType: 'inline-size' },",
    '})',
    '',
  ].join('\n')
}
