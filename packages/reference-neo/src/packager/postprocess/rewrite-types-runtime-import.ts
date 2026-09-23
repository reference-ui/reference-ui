// Tasty runtime import rewrite for the types bundle.
// It takes bundle code carrying the runtime placeholder and emits the same code with the literal tasty edge.
// The `@reference-ui/types` entry bundles before the generated tasty runtime exists in the package output, so the source compiles against a placeholder esbuild keeps external; app bundlers need the real edge in the final package for the lazy chunk graph.
// The placeholder literal duplicates the externals-list entry on purpose (same call, both sides cited) to keep the externals file a zero-import leaf.

const RUNTIME_IMPORT_PLACEHOLDER = '__REFERENCE_UI_TYPES_RUNTIME__'
const GENERATED_RUNTIME_SPECIFIER = './tasty/runtime.js'

/**
 * Rewrite the runtime placeholder to the literal tasty edge, with
 * triple-guard semantics: the placeholder must be present before, fully
 * gone after, and the literal present after.
 */
export function rewriteTypesRuntimeImport(code: string): string {
  if (!code.includes(RUNTIME_IMPORT_PLACEHOLDER)) {
    throw new Error(
      `expected @reference-ui/types bundle to contain ${RUNTIME_IMPORT_PLACEHOLDER} before postprocess`
    )
  }
  const rewritten = code.replaceAll(RUNTIME_IMPORT_PLACEHOLDER, GENERATED_RUNTIME_SPECIFIER)
  if (rewritten.includes(RUNTIME_IMPORT_PLACEHOLDER)) {
    throw new Error(`failed to fully rewrite @reference-ui/types runtime placeholder in bundle`)
  }
  if (!rewritten.includes(GENERATED_RUNTIME_SPECIFIER)) {
    throw new Error(
      `expected @reference-ui/types bundle to contain ${GENERATED_RUNTIME_SPECIFIER} after rewrite`
    )
  }
  return rewritten
}
