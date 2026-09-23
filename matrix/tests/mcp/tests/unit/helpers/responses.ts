/**
 * Small parsers for MCP SDK text/resource responses.
 *
 * Matrix tests assert JSON embedded in MCP text content and markdown/JSON
 * resources, so these helpers keep that defensive extraction in one place.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ResourceTextEntry } from './types'

/**
 * Write a raw MCP tool/resource response to matrix/.responses/<tool>/<variant>.json
 * so the real wire shape is visible at the repo top level after a local test run.
 *
 * Resolved relative to the vitest CWD (the matrix/mcp package root).
 */
export function saveResponse(tool: string, variant: string, result: unknown): void {
  const dir = resolve(process.cwd(), '.responses', tool)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, `${variant}.json`), JSON.stringify(result, null, 2), 'utf8')
}

interface TextContentEntry {
  type: 'text'
  text: string
}

export function findTextContent(result: unknown): string {
  const content = (result as { content?: unknown }).content
  if (!Array.isArray(content)) {
    return ''
  }

  const match = content.find(
    (entry): entry is TextContentEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      (entry as { type?: unknown }).type === 'text' &&
      typeof (entry as { text?: unknown }).text === 'string',
  )

  return match?.text ?? ''
}

export function findTextResource(result: unknown): ResourceTextEntry | null {
  const contents = (result as { contents?: unknown }).contents
  if (!Array.isArray(contents)) {
    return null
  }

  return (
    contents.find(
      (entry): entry is ResourceTextEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { uri?: unknown }).uri === 'string' &&
        typeof (entry as { text?: unknown }).text === 'string',
    ) ?? null
  )
}

export function parseTextJson<T>(result: unknown): T {
  const text = findTextContent(result)

  if (!text) {
    throw new Error('Expected MCP response to include a text payload.')
  }

  return JSON.parse(text) as T
}
