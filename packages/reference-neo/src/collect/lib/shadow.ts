// Local-over-upstream token shadows (E13): the token merge that also records where a value
// was replaced. It takes the scoped token fragments in merge order and emits one shadow per
// path, where a local leaf replaces an upstream leaf with a different value. Upstream over
// upstream is normal later-wins, equal values stay silent, and `extend:<base>` nodes are
// reserved for extendSystem, so they stay silent too.

import { isDeepStrictEqual } from 'node:util'
import { TOKEN_SHADOW_CODE } from '../../diagnostics/codes.ts'
import type { NativeDiagnostic } from '../../native/contract.ts'
import { CONFIG_FRAGMENT_SOURCE_PROPERTY, UPSTREAM_FRAGMENT_SOURCE } from '../constants.ts'
import { isPlainObject, mergeTokenTree, tokenLeafPaths } from './merge.ts'

const EXTEND_NODE_PREFIX = 'extend:'

/** One local leaf that replaced an upstream leaf at `path`, with both leaves and the upstream system. */
export interface TokenShadow {
  path: string
  upstream: string
  earlier: Record<string, unknown>
  local: Record<string, unknown>
}

export interface TokenMerge {
  tree: Record<string, unknown>
  shadows: TokenShadow[]
}

// One replacement as the merge reports it: the earlier leaf's source and the later fragment's source.
interface Replacement {
  path: string
  earlierSource: string | undefined
  earlier: Record<string, unknown>
  source: string | undefined
  local: Record<string, unknown>
}

function sourceOf(fragment: Record<string, unknown>): string | undefined {
  const raw = fragment[CONFIG_FRAGMENT_SOURCE_PROPERTY]
  return typeof raw === 'string' && raw !== '' ? raw : undefined
}

function isUpstream(source: string, upstreamNames: ReadonlySet<string>): boolean {
  return source === UPSTREAM_FRAGMENT_SOURCE || upstreamNames.has(source)
}

function isSilentNode(source: string): boolean {
  return source.startsWith(EXTEND_NODE_PREFIX)
}

// A shadow is a local leaf over an upstream leaf whose value differs. Anything else stays silent.
function shadowOf(r: Replacement, upstreamNames: ReadonlySet<string>): TokenShadow | undefined {
  const { earlierSource, source } = r
  if (earlierSource === undefined || source === undefined) return undefined
  if (!isUpstream(earlierSource, upstreamNames) || isUpstream(source, upstreamNames)) return undefined
  if (isSilentNode(earlierSource) || isSilentNode(source)) return undefined
  if (isDeepStrictEqual(r.earlier, r.local)) return undefined
  return { path: r.path, upstream: earlierSource, earlier: r.earlier, local: r.local }
}

/**
 * Merge the scoped token fragments in order (E14), recording the first shadow per path
 * (E13). The origin of each leaf is the source of the fragment that last wrote it, so a
 * replacement knows whether the value it replaces came from upstream.
 */
export function mergeTokenFragmentsWithShadows(
  fragments: readonly unknown[],
  upstreamNames: ReadonlySet<string>
): TokenMerge {
  let tree: Record<string, unknown> = {}
  const origins = new Map<string, string | undefined>()
  const shadows = new Map<string, TokenShadow>()
  for (const fragment of fragments) {
    if (!isPlainObject(fragment)) continue
    const source = sourceOf(fragment)
    tree = mergeTokenTree(tree, fragment, (path, earlier, local) => {
      if (shadows.has(path)) return
      const shadow = shadowOf(
        { path, earlierSource: origins.get(path), earlier, source, local },
        upstreamNames
      )
      if (shadow) shadows.set(path, shadow)
    })
    for (const path of tokenLeafPaths(fragment)) origins.set(path, source)
  }
  return { tree, shadows: [...shadows.values()] }
}

function describeLeaf(leaf: Record<string, unknown>): string {
  const keys = Object.keys(leaf)
  if (keys.length === 1 && keys[0] === 'value') return `'${String(leaf.value)}'`
  return JSON.stringify(leaf)
}

/** The sync warning for one shadow: the path, the upstream system, and both values. */
export function tokenShadowDiagnostic(shadow: TokenShadow): NativeDiagnostic {
  return {
    severity: 'warning',
    code: TOKEN_SHADOW_CODE,
    message: `Local token '${shadow.path}' replaces upstream '${shadow.upstream}' value ${describeLeaf(shadow.earlier)} with ${describeLeaf(shadow.local)}.`,
    help: [
      'A local leaf replaces the whole upstream token. Repeat its dark or light keys in the local leaf to keep them.',
    ],
  }
}
