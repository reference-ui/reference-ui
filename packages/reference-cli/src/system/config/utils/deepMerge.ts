/**
 * JS source lines for deepMerge, inlined verbatim into the generated panda.config output.
 * Kept here so the implementation and its generated form stay in one place.
 */
export const deepMergeFnLines: string[] = [
  '// deepMerge — arrays and functions are replaced, plain objects are recursively merged',
  'function deepMerge(target, ...sources) {',
  '  const result = { ...target }',
  '  for (const source of sources) {',
  "    if (!source || typeof source !== 'object') continue",
  '    for (const key of Object.keys(source)) {',
  '      const targetVal = result[key]',
  '      const sourceVal = source[key]',
  '      if (sourceVal === undefined) continue',
  "      if (Array.isArray(sourceVal) || typeof sourceVal === 'function') {",
  '        result[key] = sourceVal',
  '      } else if (',
  "        sourceVal !== null && typeof sourceVal === 'object' &&",
  "        targetVal !== null && typeof targetVal === 'object' && !Array.isArray(targetVal)",
  '      ) {',
  '        result[key] = deepMerge({ ...targetVal }, sourceVal)',
  '      } else {',
  '        result[key] = sourceVal',
  '      }',
  '    }',
  '  }',
  '  return result',
  '}',
]

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

/**
 * Deep merge utility for Panda config objects.
 * Arrays and functions are replaced (not merged). Plain objects are recursively merged.
 * Bundled into panda.config output by createPandaConfig.
 */
export function deepMerge(
  target: Record<string, unknown>,
  ...sources: Record<string, unknown>[]
): Record<string, unknown> {
  const result = { ...target }
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    for (const key of Object.keys(source)) {
      const targetVal = result[key]
      const sourceVal = source[key]
      if (sourceVal === undefined) continue
      if (Array.isArray(sourceVal) || typeof sourceVal === 'function') {
        result[key] = sourceVal
      } else if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
        result[key] = deepMerge({ ...targetVal }, sourceVal)
      } else {
        result[key] = sourceVal
      }
    }
  }
  return result
}
