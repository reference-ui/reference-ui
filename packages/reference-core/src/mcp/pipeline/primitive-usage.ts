import fg from 'fast-glob'
import { readFile } from 'node:fs/promises'
import type { ReferenceUIConfig } from '../../config'
import {
  REFERENCE_UI_PRIMITIVE_NAMES,
  type ReferenceUiPrimitiveObservation,
} from './primitives'

interface MutablePrimitiveObservation {
  count: number
  examples: string[]
  filePresence: number
  propCounts: Map<string, number>
  usedWithCounts: Map<string, number>
}

const REFERENCE_UI_REACT_IMPORT = '@reference-ui/react'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx,js,jsx}']
const DEFAULT_EXCLUDE = ['**/node_modules/**', '.reference-ui/**', 'tests/**']
const primitiveNameSet = new Set(REFERENCE_UI_PRIMITIVE_NAMES)

function increment(map: Map<string, number>, key: string, amount = 1): void {
  map.set(key, (map.get(key) ?? 0) + amount)
}

function getInclude(config: ReferenceUIConfig | undefined): string[] {
  return config?.mcp?.include?.length
    ? config.mcp.include
    : config?.include?.length
      ? config.include
      : DEFAULT_INCLUDE
}

function getExclude(config: ReferenceUIConfig | undefined): string[] {
  return config?.mcp?.exclude?.length ? config.mcp.exclude : DEFAULT_EXCLUDE
}

function parseNamedImports(source: string): Map<string, string> {
  const imports = new Map<string, string>()
  const namedImportPattern = /import\s*\{([\s\S]*?)\}\s*from\s*['"]@reference-ui\/react['"]/g

  for (const match of source.matchAll(namedImportPattern)) {
    const specifiers = match[1] ?? ''
    for (const specifier of specifiers.split(',')) {
      const trimmed = specifier.trim()
      if (!trimmed || trimmed.startsWith('type ')) continue

      const [imported, local = imported] = trimmed
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .map(value => value.trim())

      if (imported && local && primitiveNameSet.has(imported)) {
        imports.set(local, imported)
      }
    }
  }

  return imports
}

function parseNamespaceImports(source: string): string[] {
  const namespaces: string[] = []
  const namespaceImportPattern = /import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s*['"]@reference-ui\/react['"]/g

  for (const match of source.matchAll(namespaceImportPattern)) {
    if (match[1]) namespaces.push(match[1])
  }

  return namespaces
}

function extractAttributeNames(attributeSource: string): string[] {
  const names: string[] = []
  const attributePattern = /([A-Za-z_$][\w$:-]*)\s*(?:=|(?=[\s/>]))/g

  for (const match of attributeSource.matchAll(attributePattern)) {
    const name = match[1]
    if (name && name !== 'as') names.push(name)
  }

  return names
}

function observeTag(
  content: string,
  localName: string,
  primitiveName: string,
  observation: MutablePrimitiveObservation,
  seenInFile: Set<string>
): void {
  const tagPattern = new RegExp(`<\\s*${localName}\\b([^>]*)>`, 'g')

  for (const match of content.matchAll(tagPattern)) {
    const fullMatch = match[0] ?? ''
    const attributes = match[1] ?? ''
    observation.count += 1
    seenInFile.add(primitiveName)

    if (observation.examples.length < 5) {
      observation.examples.push(fullMatch.trim())
    }

    for (const attributeName of extractAttributeNames(attributes)) {
      increment(observation.propCounts, attributeName)
    }

    if (!fullMatch.endsWith('/>') && content.includes(`</${localName}>`)) {
      increment(observation.propCounts, 'children')
    }
  }
}

function observeNamespaceTag(
  content: string,
  namespace: string,
  primitiveName: string,
  observation: MutablePrimitiveObservation,
  seenInFile: Set<string>
): void {
  const tagPattern = new RegExp(`<\\s*${namespace}\\.${primitiveName}\\b([^>]*)>`, 'g')

  for (const match of content.matchAll(tagPattern)) {
    const fullMatch = match[0] ?? ''
    const attributes = match[1] ?? ''
    observation.count += 1
    seenInFile.add(primitiveName)

    if (observation.examples.length < 5) {
      observation.examples.push(fullMatch.trim())
    }

    for (const attributeName of extractAttributeNames(attributes)) {
      increment(observation.propCounts, attributeName)
    }

    if (!fullMatch.endsWith('/>') && content.includes(`</${namespace}.${primitiveName}>`)) {
      increment(observation.propCounts, 'children')
    }
  }
}

function getOrCreateObservation(
  observations: Map<string, MutablePrimitiveObservation>,
  name: string
): MutablePrimitiveObservation {
  let observation = observations.get(name)
  if (!observation) {
    observation = {
      count: 0,
      examples: [],
      filePresence: 0,
      propCounts: new Map(),
      usedWithCounts: new Map(),
    }
    observations.set(name, observation)
  }
  return observation
}

export async function collectReferenceUiPrimitiveUsage(
  cwd: string,
  config: ReferenceUIConfig | undefined
): Promise<ReferenceUiPrimitiveObservation[]> {
  const files = await fg(getInclude(config), {
    cwd,
    absolute: true,
    onlyFiles: true,
    ignore: getExclude(config),
  })
  const observations = new Map<string, MutablePrimitiveObservation>()

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    if (!content.includes(REFERENCE_UI_REACT_IMPORT)) continue

    const imports = parseNamedImports(content)
    const namespaces = parseNamespaceImports(content)
    const seenInFile = new Set<string>()

    for (const [localName, primitiveName] of imports) {
      observeTag(
        content,
        localName,
        primitiveName,
        getOrCreateObservation(observations, primitiveName),
        seenInFile
      )
    }

    for (const namespace of namespaces) {
      for (const primitiveName of REFERENCE_UI_PRIMITIVE_NAMES) {
        observeNamespaceTag(
          content,
          namespace,
          primitiveName,
          getOrCreateObservation(observations, primitiveName),
          seenInFile
        )
      }
    }

    for (const primitiveName of seenInFile) {
      const observation = observations.get(primitiveName)
      if (!observation) continue
      observation.filePresence += 1

      for (const otherName of seenInFile) {
        if (otherName !== primitiveName) {
          increment(observation.usedWithCounts, otherName)
        }
      }
    }
  }

  return Array.from(observations.entries())
    .filter(([, observation]) => observation.count > 0)
    .map(([name, observation]) => ({
      name,
      count: observation.count,
      examples: observation.examples,
      filePresence: observation.filePresence,
      propCounts: Object.fromEntries(observation.propCounts),
      usedWithCounts: Object.fromEntries(observation.usedWithCounts),
    }))
}
