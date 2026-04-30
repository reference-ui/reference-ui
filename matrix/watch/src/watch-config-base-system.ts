import { baseSystem } from '@reference-ui/lib'

const CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY = '__refCurrentFragmentSource'
const TOKENS_COLLECTOR_GLOBAL_KEY = '__refTokensCollector'

export const watchConfigImportedTokenPath = 'watch-config-imported.primary'
export const watchConfigImportedTokenVariable = '--colors-watch-config-imported-primary'
export const watchConfigImportedTokenValue = '#a855f7'

function buildImportedTokenFragment(tokenValue: string): string {
  return [
    ';(() => {',
    `  const fragment = { colors: { "watch-config-imported": { primary: { value: '${tokenValue}' } } } }`,
    `  const collector = globalThis['${TOKENS_COLLECTOR_GLOBAL_KEY}']`,
    '  if (!Array.isArray(collector)) return',
    `  const source = globalThis['${CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY}']`,
    '  if (typeof source === "string") {',
    '    Object.defineProperty(fragment, "__refConfigFragmentSource", {',
    '      configurable: true,',
    '      enumerable: false,',
    '      value: source,',
    '    })',
    '  }',
    '  collector.push(fragment)',
    '})();',
    '',
  ].join('\n')
}

export const watchConfigBaseSystem = {
  ...baseSystem,
  fragment: `${baseSystem.fragment}${buildImportedTokenFragment(watchConfigImportedTokenValue)}`,
} as const