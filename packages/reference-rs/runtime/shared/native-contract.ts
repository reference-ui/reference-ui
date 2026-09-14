/**
 * Required exports and capability markers for the native Rust addon.
 * Defines the contract that must be fulfilled by the built .node binary.
 * Consulted during build verification and native loading sanity checks.
 */
export const REQUIRED_VIRTUAL_NATIVE_EXPORTS = [
  'getNativeCapabilities',
  'rewriteCssImports',
  'rewriteCvaImports',
  'replaceFunctionName',
  'applyResponsiveStyles',
  'scanAndEmitModules',
  'analyzeAtlas',
  'analyzeStyletrace',
  'compileSystem',
] as const

export const REQUIRED_VIRTUAL_NATIVE_CAPABILITY_MARKERS = [
  'styletraceSyncRootHint',
  'replaceFunctionNameImportFrom',
] as const

export const REQUIRED_VIRTUAL_NATIVE_BINARY_MARKERS = [
  ...REQUIRED_VIRTUAL_NATIVE_EXPORTS,
  ...REQUIRED_VIRTUAL_NATIVE_CAPABILITY_MARKERS,
] as const