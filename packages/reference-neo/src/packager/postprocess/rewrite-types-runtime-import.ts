// Tasty runtime import rewrite for the types bundle.
// It takes bundle code carrying the runtime placeholder and emits the same code with the literal tasty edge.
// Dist-mode bundles wrap the placeholder in tsc's `__rewriteRelativeImportExtension` helper, so the whole call is replaced (both quote forms) and the now-unreferenced helper definition stripped; source-mode bundles carry the bare placeholder and only need the token swapped.
// The placeholder literal duplicates the externals-list entry on purpose (same call, both sides cited) to keep the externals file a zero-import leaf.

const RUNTIME_IMPORT_PLACEHOLDER = '__REFERENCE_UI_TYPES_RUNTIME__'
const GENERATED_RUNTIME_SPECIFIER = './tasty/runtime.js'
const RUNTIME_IMPORT_HELPER = '__rewriteRelativeImportExtension'

// Matches the whole helper call around the placeholder in either quote form,
// so the emitted edge is the plain, statically analyzable specifier.
const HELPER_CALL_PATTERN = new RegExp(
  `${RUNTIME_IMPORT_HELPER}\\s*\\(\\s*(['"])${RUNTIME_IMPORT_PLACEHOLDER}\\1\\s*\\)`,
  'g'
)

/**
 * Rewrite the runtime placeholder to the literal tasty edge, with
 * triple-guard semantics: the placeholder must be present before, fully
 * gone after, and the literal present after (plus zero helper residue).
 */
export function rewriteTypesRuntimeImport(code: string): string {
  if (!code.includes(RUNTIME_IMPORT_PLACEHOLDER)) {
    throw new Error(
      `expected @reference-ui/types bundle to contain ${RUNTIME_IMPORT_PLACEHOLDER} before postprocess`
    )
  }
  let rewritten = code.replace(HELPER_CALL_PATTERN, `"${GENERATED_RUNTIME_SPECIFIER}"`)
  rewritten = rewritten.replaceAll(RUNTIME_IMPORT_PLACEHOLDER, GENERATED_RUNTIME_SPECIFIER)
  if (rewritten.includes(RUNTIME_IMPORT_HELPER)) {
    rewritten = stripHelperDefinition(rewritten, RUNTIME_IMPORT_HELPER)
  }
  if (rewritten.includes(RUNTIME_IMPORT_PLACEHOLDER)) {
    throw new Error(`failed to fully rewrite @reference-ui/types runtime placeholder in bundle`)
  }
  if (rewritten.includes(RUNTIME_IMPORT_HELPER)) {
    throw new Error(
      `@reference-ui/types bundle still references ${RUNTIME_IMPORT_HELPER} after rewrite`
    )
  }
  if (!rewritten.includes(GENERATED_RUNTIME_SPECIFIER)) {
    throw new Error(
      `expected @reference-ui/types bundle to contain ${GENERATED_RUNTIME_SPECIFIER} after rewrite`
    )
  }
  return rewritten
}

function findDefinitionStart(code: string, name: string): number {
  for (const keyword of ['var ', 'let ', 'const ']) {
    const index = code.indexOf(`${keyword}${name}`)
    if (index !== -1) return index
  }
  return code.indexOf(`function ${name}`)
}

function findClosingBrace(code: string, openIndex: number): number {
  let depth = 0
  for (let index = openIndex; index < code.length; index += 1) {
    const char = code.charAt(index)
    if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

/**
 * Remove the emitted `__rewriteRelativeImportExtension` definition once its
 * call site is gone. The body holds no braces inside strings, regexes, or
 * comments, so a brace scan finds its exact end; the whole line is removed.
 */
function stripHelperDefinition(code: string, name: string): string {
  const start = findDefinitionStart(code, name)
  if (start === -1) return code
  const openBrace = code.indexOf('{', start)
  if (openBrace === -1) return code
  const closeBrace = findClosingBrace(code, openBrace)
  if (closeBrace === -1) return code
  let end = closeBrace + 1
  if (code.charAt(end) === ';') end += 1
  if (code.charAt(end) === '\n') end += 1
  const lineStart = code.lastIndexOf('\n', start) + 1
  const from = code.slice(lineStart, start).trim() === '' ? lineStart : start
  return code.slice(0, from) + code.slice(end)
}
