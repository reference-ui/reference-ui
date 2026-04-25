import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import type { ReferenceUIConfig } from '../../config'
import { bundleFragments } from '../../lib/fragments'
import {
  getBaseFragmentBundleAlias,
  getUpstreamFragments,
  scanBaseFragmentFiles,
} from '../../system/base/fragments'
import {
  createTokensCollector,
  type ReferenceTokenConfig,
  type ReferenceTokenLeaf,
} from '../../system/api/tokens'
import { getMcpDirPath } from './paths'
import type { McpToken } from './types'

// The collector getter is emitted as JS source inside a temporary ESM bundle.
// Store its value on a named global so the host process can read it after import().
const MCP_TOKEN_FRAGMENTS_GLOBAL = '__refMcpTokenFragments'

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

function createTempTokenCollectorPath(tempDir: string): string {
  return join(tempDir, `tokens-${Date.now()}-${randomBytes(6).toString('hex')}.mjs`)
}

async function collectTokenFragmentsFromBundle(input: {
  cwd: string
  config: ReferenceUIConfig
}): Promise<ReferenceTokenConfig[]> {
  const { cwd, config } = input
  const tempDir = join(getMcpDirPath(cwd), 'token-fragments')
  const collector = createTokensCollector()
  const files = scanBaseFragmentFiles(cwd, config)
  const localBundles = await bundleFragments({
    files,
    alias: getBaseFragmentBundleAlias(cwd),
  })
  const upstreamFragments = getUpstreamFragments(config.extends)
  const tempPath = createTempTokenCollectorPath(tempDir)
  const script = [
    collector.toScript(),
    collector.toRuntimeFunction(),
    ...upstreamFragments.map(fragment => `;${fragment}`),
    ...localBundles.map(({ bundle }) => `;${bundle}`),
    `globalThis['${MCP_TOKEN_FRAGMENTS_GLOBAL}'] = ${collector.toGetter()}`,
  ].join('\n')

  mkdirSync(tempDir, { recursive: true })

  try {
    writeFileSync(tempPath, script, 'utf-8')
    await import(pathToFileURL(tempPath).href)
    const fragments = (globalThis as Record<string, unknown>)[MCP_TOKEN_FRAGMENTS_GLOBAL]
    return Array.isArray(fragments) ? (fragments as ReferenceTokenConfig[]) : []
  } finally {
    collector.cleanup()
    delete (globalThis as Record<string, unknown>)[MCP_TOKEN_FRAGMENTS_GLOBAL]
    rmSync(tempPath, { force: true })
  }
}

export async function loadMcpTokens(
  cwd: string,
  config: ReferenceUIConfig
): Promise<McpToken[]> {
  const fragments = await collectTokenFragmentsFromBundle({ cwd, config })
  return flattenTokenFragments(fragments)
}
