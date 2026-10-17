/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
export type { TastyChunkModule } from './TastyChunkModule.js'
export type { TastyFnParam } from './TastyFnParam.js'
export type { TastyInterfaceSymbol } from './TastyInterfaceSymbol.js'
export type { TastyJsDoc } from './TastyJsDoc.js'
export type { TastyJsDocTag } from './TastyJsDocTag.js'
export type { TastyManifest } from './TastyManifest.js'
export type { TastyMappedModifierKind } from './TastyMappedModifierKind.js'
export type { TastyMember } from './TastyMember.js'
export type { TastyMemberKind } from './TastyMemberKind.js'
export type { TastyModule } from './TastyModule.js'
export type { TastyStructuredTypeRef } from './TastyStructuredTypeRef.js'
export type { TastySymbolIndexEntry } from './TastySymbolIndexEntry.js'
export type { TastySymbolKind } from './TastySymbolKind.js'
export type { TastySymbolRef } from './TastySymbolRef.js'
export type { TastyTemplateLiteralPart } from './TastyTemplateLiteralPart.js'
export type { TastyTupleElement } from './TastyTupleElement.js'
export type { TastyTypeAliasSymbol } from './TastyTypeAliasSymbol.js'
export type { TastyTypeOperatorKind } from './TastyTypeOperatorKind.js'
export type { TastyTypeParameter } from './TastyTypeParameter.js'
export type { TastyTypeRef } from './TastyTypeRef.js'
export type { TastyTypeReference } from './TastyTypeReference.js'

export type TastySymbol =
  | import('./TastyInterfaceSymbol.js').TastyInterfaceSymbol
  | import('./TastyTypeAliasSymbol.js').TastyTypeAliasSymbol
