/**
 * Atlas public types: the component inventory, observed elements and template diagnostics.
 * Takes the generated wire shapes and re-exports them with the stable
 * diagnostic vocabulary (`ATL-W-*` warnings, `ATL-E-*` errors) every
 * consumer filters by. Diagnostics ride the shared template Diagnostic;
 * the code union pins the four atlas failure classes for typed callers.
 */
export type { AtlasAnalysisResult } from './generated/AtlasAnalysisResult.js'

export type { AtlasConfig } from './generated/AtlasConfig.js'

export type { ObserveSpec } from './generated/ObserveSpec.js'

export type { Diagnostic as AtlasDiagnostic } from '../../diagnostics/js/index.js'

export type AtlasDiagnosticCode =
  | 'ATL-W-UNRESOLVED-PROPS-TYPE'
  | 'ATL-W-UNSUPPORTED-PROPS-ANNOTATION'
  | 'ATL-W-UNRESOLVED-INCLUDE-PACKAGE'
  | 'ATL-E-SCAN-FAILED'
  | 'ATL-W-PACKAGE-SCAN-FAILED'
  | 'ATL-W-SKIPPED-FILE'

export type { Component } from './generated/Component.js'

export type { ComponentInterface } from './generated/ComponentInterface.js'

export type { ComponentProp } from './generated/ComponentProp.js'

export type { ObservedElement } from './generated/ObservedElement.js'

export type { Usage } from './generated/Usage.js'
