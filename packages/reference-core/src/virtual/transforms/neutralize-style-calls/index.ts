const CSS_CALL_PATTERN = /(^|[^.$\w])(css)(\s*\()/gm
const CVA_CALL_PATTERN = /(^|[^.$\w])(cva)(\s*\()/gm

/**
 * Hide Panda-visible style calls outside the reserved style collection by
 * renaming direct `css()` / `cva()` call sites and binding local aliases.
 */

function insertAfterImports(sourceCode: string, insertBlock: string): string {
  const importPattern = /^import\s.+?;?$/gm
  let lastMatchIndex = -1
  let lastMatchLength = 0

  for (const match of sourceCode.matchAll(importPattern)) {
    if (typeof match.index !== 'number') continue
    lastMatchIndex = match.index
    lastMatchLength = match[0].length
  }

  if (lastMatchIndex === -1) {
    return `${insertBlock}\n${sourceCode}`
  }

  const insertIndex = lastMatchIndex + lastMatchLength
  return `${sourceCode.slice(0, insertIndex)}\n${insertBlock}${sourceCode.slice(insertIndex)}`
}

export function neutralizeStyleCalls(sourceCode: string): string {
  let transformed = sourceCode
  let replacedCss = false
  let replacedCva = false

  transformed = transformed.replace(CSS_CALL_PATTERN, (_match, prefix: string, _name: string, open: string) => {
    replacedCss = true
    return `${prefix}__reference_ui_css${open}`
  })

  transformed = transformed.replace(CVA_CALL_PATTERN, (_match, prefix: string, _name: string, open: string) => {
    replacedCva = true
    return `${prefix}__reference_ui_cva${open}`
  })

  const aliasLines: string[] = []
  if (replacedCss) aliasLines.push('const __reference_ui_css = css;')
  if (replacedCva) aliasLines.push('const __reference_ui_cva = cva;')

  if (aliasLines.length === 0) {
    return sourceCode
  }

  return insertAfterImports(transformed, aliasLines.join('\n'))
}