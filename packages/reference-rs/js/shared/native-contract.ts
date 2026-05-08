export const REQUIRED_VIRTUAL_NATIVE_EXPORTS = [
  'getNativeCapabilities',
  'rewriteCssImports',
  'rewriteCvaImports',
  'replaceFunctionName',
  'applyResponsiveStyles',
  'scanAndEmitModules',
  'analyzeAtlas',
  'analyzeStyletrace',
] as const

export const REQUIRED_VIRTUAL_NATIVE_CAPABILITY_MARKERS = [
  'styletraceSyncRootHint',
  'replaceFunctionNameImportFrom',
] as const

export const REQUIRED_VIRTUAL_NATIVE_BINARY_MARKERS = [
  ...REQUIRED_VIRTUAL_NATIVE_EXPORTS,
  ...REQUIRED_VIRTUAL_NATIVE_CAPABILITY_MARKERS,
] as const