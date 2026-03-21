import type {
  RawTastyInterfaceSymbol,
  RawTastyManifest,
  RawTastyMember,
  RawTastySymbol,
  RawTastySymbolIndexEntry,
  RawTastySymbolRef,
  RawTastyTypeAliasSymbol,
  RawTastyTypeRef,
  RawTastyTypeReference,
  TastyRuntimeModule,
  TastySymbolSearchResult,
} from '../api-types'

export type TastySymbolModel = RawTastySymbol
export type ArtifactImporter = (artifactPath: string) => Promise<unknown>
export type ModuleNamespace = Record<string, unknown>

const CURRENT_TASTY_MANIFEST_VERSION = '2'
let artifactImportVersion = 0

export function wrapRuntimeError(prefix: string, error: unknown): Error {
  const suffix = error instanceof Error ? error.message : String(error)
  return new Error(`${prefix} ${suffix}`)
}

export function createAmbiguousSymbolNameError(
  name: string,
  matches: TastySymbolSearchResult[],
): Error {
  return new Error(
    `Ambiguous symbol name "${name}". Matches: ${matches.map(formatSymbolCandidate).join(', ')}`,
  )
}

export function formatSymbolCandidate(result: TastySymbolSearchResult): string {
  return `${result.id} (${result.library})`
}

export function isInterfaceSymbol(symbol: TastySymbolModel): symbol is RawTastyInterfaceSymbol {
  return 'members' in symbol && 'extends' in symbol && 'types' in symbol
}

export function isTypeAliasSymbol(symbol: TastySymbolModel): symbol is RawTastyTypeAliasSymbol {
  return 'definition' in symbol
}

export function isTypeReference(typeRef: RawTastyTypeRef): typeRef is RawTastyTypeReference {
  return (
    typeof typeRef === 'object' &&
    typeRef !== null &&
    'id' in typeRef &&
    'name' in typeRef &&
    'library' in typeRef
  )
}

export function isRawStructuredTypeRef(
  typeRef: RawTastyTypeRef,
): typeRef is Extract<RawTastyTypeRef, { kind: 'raw' }> {
  return !isTypeReference(typeRef) && typeRef.kind === 'raw'
}

export function uniqueById<T>(values: T[], getId: (value: T) => string): T[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const id = getId(value)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export async function defaultArtifactImporter(artifactPath: string): Promise<unknown> {
  const specifier = await resolveArtifactSpecifier(artifactPath)
  return import(/* @vite-ignore */ withFreshFileSpecifier(specifier))
}

export function normalizeModuleNamespace(value: unknown): ModuleNamespace {
  if (value == null || typeof value !== 'object') {
    throw new Error('Expected imported artifact module to be an object.')
  }
  return value as ModuleNamespace
}

export function extractManifest(value: unknown): RawTastyManifest {
  const moduleValue = normalizeModuleNamespace(value)
  const manifest = (moduleValue.default ?? moduleValue.manifest) as unknown
  if (!isRawTastyManifest(manifest)) {
    throw new Error(
      'Malformed Tasty manifest module. Expected a default or manifest export with version, warnings, symbolsByName, and symbolsById.',
    )
  }
  if (manifest.version !== CURRENT_TASTY_MANIFEST_VERSION) {
    throw new Error(
      `Unsupported Tasty manifest version "${manifest.version}". Expected "${CURRENT_TASTY_MANIFEST_VERSION}".`,
    )
  }
  return manifest
}

export function extractChunkSymbol(
  moduleValue: ModuleNamespace,
  symbolId: string,
): TastySymbolModel {
  const direct = moduleValue[symbolId]
  if (isTastySymbolModel(direct)) {
    return assertChunkSymbolId(direct, symbolId, 'named')
  }

  const defaultExport = moduleValue.default
  if (isTastySymbolModel(defaultExport) && defaultExport.id === symbolId) {
    return defaultExport
  }

  throw new Error(
    `Missing symbol export in Tasty chunk for id "${symbolId}". Expected a named export "${symbolId}" or a matching default export.`,
  )
}

export function extractTastyRuntimeModule(value: unknown): TastyRuntimeModule {
  const moduleValue = normalizeModuleNamespace(value)
  const runtimeModule = isTastyRuntimeModule(moduleValue)
    ? moduleValue
    : moduleValue.default

  if (!isTastyRuntimeModule(runtimeModule)) {
    throw new Error(
      'Malformed Tasty browser runtime module. Expected manifest, manifestUrl, and importTastyArtifact exports.',
    )
  }

  return runtimeModule
}

export async function resolveArtifactPath(basePath: string, relativePath: string): Promise<string> {
  if (relativePath.startsWith('./') || relativePath.startsWith('../')) {
    const baseSpecifier = await resolveArtifactSpecifier(basePath)
    try {
      return new URL(relativePath, baseSpecifier).href
    } catch (error: unknown) {
      throw wrapRuntimeError(
        `Could not resolve Tasty artifact path "${relativePath}" relative to "${basePath}".`,
        error,
      )
    }
  }
  return relativePath
}

export async function resolveArtifactSpecifier(pathOrSpecifier: string): Promise<string> {
  if (isUrlLike(pathOrSpecifier)) {
    return pathOrSpecifier
  }

  const { pathToFileURL } = await import('node:url')
  return pathToFileURL(pathOrSpecifier).href
}

function withFreshFileSpecifier(specifier: string): string {
  if (!specifier.startsWith('file:')) {
    return specifier
  }

  const url = new URL(specifier)
  url.searchParams.set('tastyv', String(++artifactImportVersion))
  return url.href
}

function isUrlLike(value: string): boolean {
  return (
    value.startsWith('file:') ||
    value.startsWith('http:') ||
    value.startsWith('https:') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  )
}

function isRawTastyManifest(value: unknown): value is RawTastyManifest {
  if (value == null || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.version === 'string' &&
    Array.isArray(candidate.warnings) &&
    candidate.warnings.every((warning) => typeof warning === 'string') &&
    candidate.symbolsByName != null &&
    typeof candidate.symbolsByName === 'object' &&
    Object.values(candidate.symbolsByName).every(
      (symbolIds) =>
        Array.isArray(symbolIds) && symbolIds.every((symbolId) => typeof symbolId === 'string'),
    ) &&
    candidate.symbolsById != null &&
    typeof candidate.symbolsById === 'object'
  )
}

function isTastyRuntimeModule(value: unknown): value is TastyRuntimeModule {
  if (value == null || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    isRawTastyManifest(candidate.manifest) &&
    typeof candidate.manifestUrl === 'string' &&
    isUrlLike(candidate.manifestUrl) &&
    typeof candidate.importTastyArtifact === 'function'
  )
}

function isTastySymbolModel(value: unknown): value is TastySymbolModel {
  if (value == null || typeof value !== 'object') return false
  return 'id' in value && 'name' in value && 'library' in value
}

function assertChunkSymbolId(
  symbol: TastySymbolModel,
  expectedId: string,
  exportKind: 'default' | 'named',
): TastySymbolModel {
  if (symbol.id !== expectedId) {
    throw new Error(
      `Malformed ${exportKind} chunk export for symbol id "${expectedId}". Received "${symbol.id}".`,
    )
  }
  return symbol
}

export function collectUserOwnedReferencesFromSymbol(symbol: TastySymbolModel): RawTastySymbolRef[] {
  const refs: RawTastySymbolRef[] = []

  if (isInterfaceSymbol(symbol)) {
    refs.push(...symbol.extends)
    refs.push(...symbol.types)
    for (const member of symbol.members) {
      collectUserOwnedReferencesFromMember(member, refs)
    }
  } else if (symbol.definition) {
    collectUserOwnedReferencesFromTypeRef(symbol.definition, refs)
  }

  for (const param of symbol.typeParameters ?? []) {
    if (param.constraint) collectUserOwnedReferencesFromTypeRef(param.constraint, refs)
    if (param.default) collectUserOwnedReferencesFromTypeRef(param.default, refs)
  }

  return refs
}

function collectUserOwnedReferencesFromMember(member: RawTastyMember, refs: RawTastySymbolRef[]) {
  if (member.type) {
    collectUserOwnedReferencesFromTypeRef(member.type, refs)
  }
}

function collectUserOwnedReferencesFromTypeRef(typeRef: RawTastyTypeRef, refs: RawTastySymbolRef[]) {
  if (isTypeReference(typeRef)) {
    refs.push({
      id: typeRef.id,
      name: typeRef.name,
      library: typeRef.library,
    })
    for (const arg of typeRef.typeArguments ?? []) {
      collectUserOwnedReferencesFromTypeRef(arg, refs)
    }
    return
  }

  switch (typeRef.kind) {
    case 'object':
      for (const member of typeRef.members) {
        collectUserOwnedReferencesFromMember(member, refs)
      }
      return
    case 'union':
    case 'intersection':
      for (const item of typeRef.types) {
        collectUserOwnedReferencesFromTypeRef(item, refs)
      }
      return
    case 'array':
      collectUserOwnedReferencesFromTypeRef(typeRef.element, refs)
      return
    case 'tuple':
      for (const element of typeRef.elements) {
        collectUserOwnedReferencesFromTypeRef(element.element, refs)
      }
      return
    case 'indexed_access':
      collectUserOwnedReferencesFromTypeRef(typeRef.object, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.index, refs)
      return
    case 'function':
      for (const param of typeRef.params) {
        if (param.typeRef) collectUserOwnedReferencesFromTypeRef(param.typeRef, refs)
      }
      collectUserOwnedReferencesFromTypeRef(typeRef.returnType, refs)
      return
    case 'constructor':
      for (const param of typeRef.params) {
        if (param.typeRef) collectUserOwnedReferencesFromTypeRef(param.typeRef, refs)
      }
      collectUserOwnedReferencesFromTypeRef(typeRef.returnType, refs)
      for (const param of typeRef.typeParameters ?? []) {
        if (param.constraint) collectUserOwnedReferencesFromTypeRef(param.constraint, refs)
        if (param.default) collectUserOwnedReferencesFromTypeRef(param.default, refs)
      }
      return
    case 'type_operator':
      collectUserOwnedReferencesFromTypeRef(typeRef.target, refs)
      return
    case 'conditional':
      collectUserOwnedReferencesFromTypeRef(typeRef.checkType, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.extendsType, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.trueType, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.falseType, refs)
      return
    case 'mapped':
      collectUserOwnedReferencesFromTypeRef(typeRef.sourceType, refs)
      if (typeRef.nameType) collectUserOwnedReferencesFromTypeRef(typeRef.nameType, refs)
      if (typeRef.valueType) collectUserOwnedReferencesFromTypeRef(typeRef.valueType, refs)
      return
    case 'template_literal':
      for (const part of typeRef.parts) {
        if (part.kind === 'type') collectUserOwnedReferencesFromTypeRef(part.value, refs)
      }
      return
    default:
      return
  }
}

