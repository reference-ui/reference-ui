/**
 * Atlas public types: the component inventory plus template diagnostics.
 * Takes the generated wire shapes and re-exports them with the stable
 * diagnostic vocabulary (`ATL-W-*` warnings, `ATL-E-*` errors) every
 * consumer filters by. Diagnostics ride the shared template Diagnostic;
 * the code union pins the four atlas failure classes for typed callers.
 */
export type { AtlasAnalysisResult } from './generated/AtlasAnalysisResult'

export type { AtlasConfig } from './generated/AtlasConfig'

export type { Diagnostic as AtlasDiagnostic } from '../../diagnostics/js/index.js'

export type AtlasDiagnosticCode =
  | 'ATL-W-UNRESOLVED-PROPS-TYPE'
  | 'ATL-W-UNSUPPORTED-PROPS-ANNOTATION'
  | 'ATL-W-UNRESOLVED-INCLUDE-PACKAGE'
  | 'ATL-E-SCAN-FAILED'
  | 'ATL-W-PACKAGE-SCAN-FAILED'

export type { Component } from './generated/Component'

export type { ComponentInterface } from './generated/ComponentInterface'

export type { ComponentProp } from './generated/ComponentProp'

export type { Usage } from './generated/Usage'
