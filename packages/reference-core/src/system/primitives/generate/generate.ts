import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Liquid } from 'liquidjs'

const engine = new Liquid()

export interface TagDescriptor {
  name: string
  exportName: string
}

export function toExportName(tag: string): string {
  if (tag === 'object') return 'Obj'
  if (tag === 'var') return 'Var'
  if (tag.length <= 1) return tag.toUpperCase()
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

export function readTags(tagsPath: string): TagDescriptor[] {
  const tagsContent = readFileSync(tagsPath, 'utf8')
  const listStart = tagsContent.indexOf('[')
  const listEnd = tagsContent.indexOf('] as const', listStart)
  if (listStart < 0 || listEnd < 0) {
    throw new Error('Could not parse TAGS from system/primitives/tags.ts')
  }

  const rawTags = tagsContent
    .slice(listStart + 1, listEnd)
    .split(',')
    .map((value) => value.replace(/['"]/g, '').trim())
    .filter(Boolean)

  return rawTags.map((name) => ({
    name,
    exportName: toExportName(name),
  }))
}

export async function createPrimitiveSource(cliRoot: string): Promise<string> {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const templatePath = join(currentDir, 'primitives.liquid')
  const template = readFileSync(templatePath, 'utf8')

  const tagsPath = join(cliRoot, 'src/system/primitives/tags.ts')
  const tags = readTags(tagsPath)

  return engine.parseAndRender(template, { tags })
}
