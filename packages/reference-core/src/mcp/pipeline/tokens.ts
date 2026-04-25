import { join } from 'node:path'
import type { ReferenceUIConfig } from '../../config'
import { collectFragments } from '../../lib/fragments'
import { getBaseFragmentBundleAlias, scanBaseFragmentFiles } from '../../system/base/fragments'
import {
  createTokensCollector,
  type ReferenceTokenConfig,
  type ReferenceTokenLeaf,
} from '../../system/api/tokens'
import { getMcpDirPath } from './paths'
import type { McpToken } from './types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isTokenLeaf(value: unknown): value is ReferenceTokenLeaf {
  return isPlainObject(value) && ('value' in value || 'light' in value || 'dark' in value)
}

function getTokenCategory(path: string[]): string {
  return path[0] ?? 'tokens'
}

function toMcpToken(path: string[], leaf: ReferenceTokenLeaf): McpToken {
  const token: McpToken = {
    path: path.join('.'),
    category: getTokenCategory(path),
  }

  if ('value' in leaf) token.value = leaf.value
  if ('light' in leaf) token.light = leaf.light
  if ('dark' in leaf) token.dark = leaf.dark
  if (typeof leaf.description === 'string') token.description = leaf.description

  return token
}

function flattenTokenNode(
  node: ReferenceTokenConfig | ReferenceTokenLeaf,
  path: string[] = [],
  out: McpToken[] = []
): McpToken[] {
  if (isTokenLeaf(node)) {
    out.push(toMcpToken(path, node))
    return out
  }

  for (const [key, value] of Object.entries(node)) {
    if (!isPlainObject(value)) continue
    flattenTokenNode(value as ReferenceTokenConfig | ReferenceTokenLeaf, [...path, key], out)
  }

  return out
}

export function flattenTokenFragments(fragments: ReferenceTokenConfig[]): McpToken[] {
  const byPath = new Map<string, McpToken>()

  for (const fragment of fragments) {
    for (const token of flattenTokenNode(fragment)) {
      byPath.set(token.path, token)
    }
  }

  return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path))
}

export async function loadMcpTokens(
  cwd: string,
  config: ReferenceUIConfig
): Promise<McpToken[]> {
  const files = scanBaseFragmentFiles(cwd, config)
  const fragments = await collectFragments<ReferenceTokenConfig>({
    files,
    collector: createTokensCollector(),
    tempDir: join(getMcpDirPath(cwd), 'token-fragments'),
    alias: getBaseFragmentBundleAlias(cwd),
  })

  return flattenTokenFragments(fragments)
}
