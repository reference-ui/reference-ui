/**
 * Typescript source file for Reference UI module.
 * Type guards that tell raw symbols, interfaces, type aliases and type references apart. This is
 * a leaf module with type-only imports, so every other internal module can depend on it safely.
 */
import type {
  RawTastyInterfaceSymbol,
  RawTastyStructuredTypeRef,
  RawTastySymbol,
  RawTastyTypeAliasSymbol,
  RawTastyTypeRef,
  RawTastyTypeReference,
} from '../api-types.js'

export type TastySymbolModel = RawTastySymbol

export function isInterfaceSymbol(
  symbol: TastySymbolModel
): symbol is RawTastyInterfaceSymbol {
  return 'members' in symbol && 'extends' in symbol && 'types' in symbol
}

export function isTypeAliasSymbol(
  symbol: TastySymbolModel
): symbol is RawTastyTypeAliasSymbol {
  return 'definition' in symbol
}

export function isTypeReference(
  typeRef: RawTastyTypeRef
): typeRef is RawTastyTypeReference {
  return (
    typeof typeRef === 'object' &&
    typeRef !== null &&
    'id' in typeRef &&
    'name' in typeRef &&
    'library' in typeRef
  )
}

export function isRawStructuredTypeRef(
  typeRef: RawTastyTypeRef
): typeRef is Extract<RawTastyTypeRef, { kind: 'raw' }> {
  return !isTypeReference(typeRef) && typeRef.kind === 'raw'
}
