// Union member merger: it takes a type alias whose definition is a union and, when every branch
// resolves to an object type (an interface or alias reference, an object literal, or an
// intersection of those), emits one merged member list for the API table. Each member name appears
// once in first-seen order; its type is the deduplicated union of the branch types, so a literal
// discriminant becomes a value set; docs and default come from the first branch that has them;
// a member missing from any branch is optional. A union with any other branch yields undefined.

import type {
  RawTastyJsDocTag,
  RawTastyMember,
  RawTastyTypeRef,
  RawTastyTypeReference,
  TastyApi,
  TastyMember,
  TastySymbol,
} from '@reference-ui/rust/tasty'
import { readReferenceDisplayResult } from '../tasty/api.ts'
import { createReferenceType, formatReferenceType } from './type.ts'

/** The merged members of a union alias, and the symbol each inherited member comes from (root-owned members are absent). */
export interface UnionMemberMerge {
  members: TastyMember[]
  origins: Map<string, TastySymbol>
}

/** One branch's members by name, each with the symbol it came through (undefined: written inline in the branch). */
interface BranchMembers {
  raws: Map<string, RawTastyMember>
  owners: Map<string, TastySymbol | undefined>
}

/** The tasty API plus the member factory its runtime class carries but its interface does not yet declare. */
type MemberFactoryApi = TastyApi & { createMember(raw: RawTastyMember): TastyMember }

export async function loadUnionAliasMembers(
  api: TastyApi,
  symbol: TastySymbol,
  cutNotices: Set<string>,
): Promise<UnionMemberMerge | undefined> {
  if (symbol.getKind() !== 'typeAlias' || !hasMemberFactory(api)) return undefined
  const raw = symbol.getUnderlyingType()?.getRaw()
  if (!raw || !isRawUnion(raw)) return undefined

  const branches: BranchMembers[] = []
  for (const branch of raw.types) {
    const members = await loadBranchMembers(api, branch, cutNotices)
    if (!members || members.raws.size === 0) return undefined
    branches.push(members)
  }
  return mergeBranches(api, branches)
}

function mergeBranches(api: MemberFactoryApi, branches: BranchMembers[]): UnionMemberMerge {
  const names = new Set<string>()
  for (const branch of branches) for (const name of branch.raws.keys()) names.add(name)

  const members: TastyMember[] = []
  const origins = new Map<string, TastySymbol>()
  for (const name of names) {
    const present = branches.filter(branch => branch.raws.has(name))
    const merged = api.createMember(
      mergeMemberRaws(
        present.map(branch => branch.raws.get(name)!),
        present.length < branches.length,
      ),
    )
    const owner = sharedOwner(present.map(branch => branch.owners.get(name)))
    members.push(merged)
    if (owner) origins.set(merged.getId(), owner)
  }
  return { members, origins }
}

/** Inherited-from grouping survives only when every branch that has the member got it through the same symbol. */
function sharedOwner(owners: Array<TastySymbol | undefined>): TastySymbol | undefined {
  const [first] = owners
  if (!first) return undefined
  return owners.every(owner => owner?.getId() === first.getId()) ? first : undefined
}

function mergeMemberRaws(raws: RawTastyMember[], missingSomewhere: boolean): RawTastyMember {
  const first = raws[0]!
  const documented = raws.find(hasDocumentation) ?? first
  return {
    ...documented,
    name: first.name,
    kind: first.kind,
    optional: missingSomewhere || raws.some(raw => raw.optional),
    readonly: raws.every(raw => raw.readonly),
    jsdoc: withDefaultTag(documented, raws),
    type: mergeTypes(raws),
  }
}

function hasDocumentation(raw: RawTastyMember): boolean {
  return Boolean(raw.description || raw.jsdoc?.summary || raw.jsdoc?.tags.length)
}

function withDefaultTag(documented: RawTastyMember, raws: RawTastyMember[]): RawTastyMember['jsdoc'] {
  const tags = documented.jsdoc?.tags ?? []
  if (tags.some(tag => tag.name === 'default')) return documented.jsdoc
  const defaultTag = raws.map(findDefaultTag).find(tag => tag != null)
  if (!defaultTag) return documented.jsdoc
  return { ...documented.jsdoc, tags: [...tags, defaultTag] }
}

function findDefaultTag(raw: RawTastyMember): RawTastyJsDocTag | undefined {
  return raw.jsdoc?.tags.find(tag => tag.name === 'default')
}

/** The branch types as one union, nested unions flattened and repeats (by printed form) dropped. */
function mergeTypes(raws: RawTastyMember[]): RawTastyTypeRef | null {
  const unique = new Map<string, RawTastyTypeRef>()
  for (const raw of raws) {
    for (const type of flattenUnion(raw.type)) {
      const key = printedType(type)
      if (!unique.has(key)) unique.set(key, type)
    }
  }
  const types = [...unique.values()]
  if (types.length === 0) return null
  return types.length === 1 ? types[0]! : { kind: 'union', types }
}

function flattenUnion(type: RawTastyTypeRef | null): RawTastyTypeRef[] {
  if (!type) return []
  return isRawUnion(type) ? type.types.flatMap(flattenUnion) : [type]
}

function printedType(type: RawTastyTypeRef): string {
  const referenceType = createReferenceType(type)
  return referenceType ? formatReferenceType(referenceType) : JSON.stringify(type)
}

/** A branch's members, or undefined when the branch is not an object type. */
async function loadBranchMembers(
  api: MemberFactoryApi,
  raw: RawTastyTypeRef,
  cutNotices: Set<string>,
): Promise<BranchMembers | undefined> {
  if (isRawTypeReference(raw)) return loadReferenceMembers(api, raw, cutNotices)

  if (raw.kind === 'object') {
    const members = emptyBranch()
    for (const member of raw.members) setMember(members, member, undefined)
    return members
  }

  if (raw.kind === 'intersection') return loadIntersectionMembers(api, raw.types, cutNotices)
  return undefined
}

async function loadIntersectionMembers(
  api: MemberFactoryApi,
  parts: RawTastyTypeRef[],
  cutNotices: Set<string>,
): Promise<BranchMembers | undefined> {
  const merged = emptyBranch()
  for (const part of parts) {
    const members = await loadBranchMembers(api, part, cutNotices)
    if (!members) return undefined
    for (const [name, raw] of members.raws) merged.raws.set(name, raw)
    for (const [name, owner] of members.owners) merged.owners.set(name, owner)
  }
  return merged
}

async function loadReferenceMembers(
  api: TastyApi,
  reference: RawTastyTypeReference,
  cutNotices: Set<string>,
): Promise<BranchMembers | undefined> {
  const source = await resolveReferenceTypeSourceSymbol(api, reference)
  if (!source) return undefined

  const projection = await readReferenceDisplayResult(api, source)
  for (const notice of projection.notices) cutNotices.add(notice)
  const members = emptyBranch()
  for (const member of projection.members) setMember(members, member.getRaw(), source)
  return members
}

function emptyBranch(): BranchMembers {
  return { raws: new Map(), owners: new Map() }
}

function setMember(branch: BranchMembers, raw: RawTastyMember, owner: TastySymbol | undefined): void {
  branch.raws.set(raw.name, raw)
  branch.owners.set(raw.name, owner)
}

export async function resolveReferenceTypeSourceSymbol(
  api: TastyApi,
  reference: RawTastyTypeReference,
): Promise<TastySymbol | undefined> {
  if (api.hasManifestSymbol(reference.id)) {
    return api.loadSymbolById(reference.id)
  }

  try {
    const scoped = await api.findSymbolByScopedName(reference.library, reference.name)
    if (scoped) return scoped
  } catch {
    // The emitted library can point at a re-exporting module; try a unique bare match.
  }

  const matches = await api.findSymbolsByName(reference.name)
  if (matches.length === 1) return api.loadSymbolById(matches[0]!.id)
  return undefined
}

function hasMemberFactory(api: TastyApi): api is MemberFactoryApi {
  return typeof (api as Partial<MemberFactoryApi>).createMember === 'function'
}

function isRawUnion(raw: RawTastyTypeRef): raw is Extract<RawTastyTypeRef, { kind: 'union' }> {
  return 'kind' in raw && raw.kind === 'union'
}

function isRawTypeReference(raw: RawTastyTypeRef): raw is RawTastyTypeReference {
  return 'id' in raw && 'name' in raw && 'library' in raw
}
