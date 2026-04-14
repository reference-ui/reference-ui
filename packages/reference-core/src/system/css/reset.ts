import type { ReferenceUIConfig } from '../../config'

const RESET_RULES = [
  '*,::before,::after {',
  '  box-sizing: border-box;',
  '}',
  '',
  'html {',
  '  line-height: 1.5;',
  '  -webkit-text-size-adjust: 100%;',
  '  tab-size: 4;',
  '}',
  '',
  'body {',
  '  margin: 0;',
  '  min-height: 100%;',
  '}',
  '',
  'button,input,select,textarea {',
  '  font: inherit;',
  '  color: inherit;',
  '}',
  '',
  'img,picture,video,canvas,svg {',
  '  display: block;',
  '  max-width: 100%;',
  '}',
] as const

function indentLines(lines: readonly string[], prefix: string): string {
  return lines
    .map((line) => (line ? `${prefix}${line}` : ''))
    .join('\n')
}

export function shouldInjectReset(config: ReferenceUIConfig): boolean {
  return config.normalizeCss !== false
}

export function createRuntimeResetStylesheet(): string {
  return ['@layer reset {', indentLines(RESET_RULES, '  '), '}'].join('\n')
}

export function createPortableResetStylesheet(layerName: string): string {
  return [
    `@layer ${layerName} {`,
    '  @layer reset {',
    indentLines(RESET_RULES, '    '),
    '  }',
    '}',
  ].join('\n')
}
