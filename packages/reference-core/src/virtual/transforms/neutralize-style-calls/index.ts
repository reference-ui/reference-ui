import { replaceFunctionName } from '@reference-ui/rust'

const SYSTEM_CSS_IMPORT_PATH = 'src/system/css'

/**
 * Hide Panda-visible style calls outside the reserved style collection by
 * renaming direct `css()` / `cva()` call sites and aliasing their imports.
 */

export function neutralizeStyleCalls(
  sourceCode: string,
  relativePath = 'src/virtual/neutralize-style-calls.tsx',
): string {
  const cssNeutralized = replaceFunctionName(
    sourceCode,
    relativePath,
    'css',
    '__reference_ui_css',
    SYSTEM_CSS_IMPORT_PATH,
  )
  const replacedCss = cssNeutralized !== sourceCode

  const transformed = replaceFunctionName(
    cssNeutralized,
    relativePath,
    'cva',
    '__reference_ui_cva',
    SYSTEM_CSS_IMPORT_PATH,
  )
  return replacedCss || transformed !== cssNeutralized ? transformed : sourceCode
}