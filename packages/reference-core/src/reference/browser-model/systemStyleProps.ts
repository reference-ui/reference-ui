// System style-prop filter: it takes a loaded symbol and its projected members and drops the style
// props a Reference UI system runtime contributes. The react runtime's `StyleProps` is a conditional
// type, so it never expands into rows; a runtime copy bundled inside another package (the one
// `@reference-ui/icons` publishes) spells the same type out, and without this filter a `DivProps`
// reached through it lists every style prop. The names come from any `StyleProps` of a
// `@reference-ui/*` library the symbol reaches through other `@reference-ui/*` types, and a member
// the symbol or its heritage declares itself (it has an origin) is never dropped.

import type { TastyApi, TastyMember, TastySymbol } from '@reference-ui/rust/tasty'
import { readReferenceDisplayResult } from '../tasty/api.ts'

const SYSTEM_LIBRARY_PREFIX = '@reference-ui/'
const STYLE_PROPS_NAME = 'StyleProps'
/** Bounds the walk to the few runtime aliases (`DivProps`, `StyleProps`) between a props type and its style props. */
const MAX_SYSTEM_SYMBOLS = 24

/** The system-library references written anywhere in a raw symbol: any node carrying an id, name and library. */
function collectSystemReferences(raw: unknown, refs: Map<string, string>): void {
  if (Array.isArray(raw)) {
    for (const item of raw) collectSystemReferences(item, refs)
    return
  }
  if (typeof raw !== 'object' || raw === null) return
  const node = raw as Record<string, unknown>
  if (typeof node.id === 'string' && typeof node.name === 'string' && typeof node.library === 'string') {
    if (node.library.startsWith(SYSTEM_LIBRARY_PREFIX)) refs.set(node.id, node.name)
  }
  for (const value of Object.values(node)) collectSystemReferences(value, refs)
}

/** Every system `StyleProps` reachable from `root` through system-library symbols. */
async function findSystemStyleProps(api: TastyApi, root: TastySymbol): Promise<TastySymbol[]> {
  const found: TastySymbol[] = []
  const visited = new Set<string>([root.getId()])
  const queue: TastySymbol[] = [root]
  while (queue.length > 0 && visited.size <= MAX_SYSTEM_SYMBOLS) {
    const current = queue.shift() as TastySymbol
    const refs = new Map<string, string>()
    collectSystemReferences(current.getRaw(), refs)
    for (const [id, name] of refs) {
      if (visited.has(id)) continue
      visited.add(id)
      // A built-in such as `Omit` carries a name-only id and has no chunk; it is not a symbol to follow.
      const dependency = await api.loadSymbolById(id).catch(() => undefined)
      if (!dependency) continue
      if (name === STYLE_PROPS_NAME) found.push(dependency)
      else queue.push(dependency)
    }
  }
  return found
}

async function systemStylePropNames(
  api: TastyApi,
  root: TastySymbol,
  cutNotices: Set<string>,
): Promise<Set<string>> {
  const names = new Set<string>()
  for (const styleProps of await findSystemStyleProps(api, root)) {
    const projection = await readReferenceDisplayResult(api, styleProps)
    for (const notice of projection.notices) cutNotices.add(notice)
    for (const member of projection.members) names.add(member.getName())
  }
  return names
}

/** `members` without the system style props that no origin claims; the same array when none apply. */
export async function dropSystemStyleProps(
  api: TastyApi,
  symbol: TastySymbol,
  members: TastyMember[],
  origins: Map<string, TastySymbol>,
  cutNotices: Set<string>,
): Promise<TastyMember[]> {
  if (members.length === 0) return members
  const names = await systemStylePropNames(api, symbol, cutNotices)
  if (names.size === 0) return members
  return members.filter(member => origins.has(member.getId()) || !names.has(member.getName()))
}
