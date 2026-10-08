// S6 reference API: it takes the tasty API builders plus the model builders
// and types and emits the `./reference` surface consumers import. MCP and
// other Node consumers build documents here without touching the browser
// runtime or the presentation mirror.
// (Seam S6 of the Objective 1 cartography; Objective 2 migrates mcp onto it.)

export {
  createReferenceUiTastyApi,
  getReferenceUiTastyApiOptions,
  getReferenceUiTastyBrowserApiOptions,
} from './tasty/api.ts'

export {
  createReferenceDocument,
  formatReferenceTypeParameter,
} from './browser-model/index.ts'

export {
  formatReferenceType,
  createReferenceType,
  createReferenceTypeParameter,
} from './browser-model/type.ts'

export type {
  ReferenceDocument,
  ReferenceMemberDocument,
  ReferenceType,
  ReferenceTypeParameter,
  ReferenceCallableParameter,
  ReferenceInlineMember,
  ReferenceJsDoc,
} from './browser/types.ts'
