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

interface ImportDeclaration {
  clause: string
  source: string
}

interface ImportParseResult {
  declaration?: ImportDeclaration
  nextCursor: number
}

interface ObserveTagInput {
  content: string
  localName: string
  primitiveName: string
  observation: MutablePrimitiveObservation
  seenInFile: Set<string>
}

const REFERENCE_UI_REACT_IMPORT = '@reference-ui/react'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx,js,jsx}']
const DEFAULT_EXCLUDE = ['**/node_modules/**', '.reference-ui/**', 'tests/**']
const primitiveNameSet = new Set(REFERENCE_UI_PRIMITIVE_NAMES)

function increment(map: Map<string, number>, key: string, amount = 1): void {
  map.set(key, (map.get(key) ?? 0) + amount)
}

function getInclude(config: ReferenceUIConfig | undefined): string[] {
  if (config?.mcp?.include?.length) return config.mcp.include
  if (config?.include?.length) return config.include
  return DEFAULT_INCLUDE
}

function getExclude(config: ReferenceUIConfig | undefined): string[] {
  return config?.mcp?.exclude?.length ? config.mcp.exclude : DEFAULT_EXCLUDE
}

function isIdentifierPart(value: string | undefined): boolean {
  if (!value) return false
  const code = value.charCodeAt(0)
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    value === '_' ||
    value === '$'
  )
}

function isWhitespace(value: string | undefined): boolean {
  return value === ' ' || value === '\n' || value === '\r' || value === '\t'
}

function skipWhitespace(source: string, start: number): number {
  let cursor = start
  while (cursor < source.length && isWhitespace(source[cursor])) cursor += 1
  return cursor
}

function findImportFromIndex(source: string, start: number): number {
  let cursor = start
  while (cursor < source.length) {
    const fromIndex = source.indexOf('from', cursor)
    if (fromIndex === -1) return -1

    const before = source[fromIndex - 1]
    const after = source[fromIndex + 4]
    if (!isIdentifierPart(before) && !isIdentifierPart(after)) return fromIndex
    cursor = fromIndex + 4
  }

  return -1
}

function isImportKeywordAt(source: string, index: number): boolean {
  return (
    !isIdentifierPart(source[index - 1]) &&
    source.startsWith('import', index) &&
    isWhitespace(source[index + 6])
  )
}

function findModuleQuoteIndex(source: string, fromIndex: number): number {
  const singleQuoteIndex = source.indexOf("'", fromIndex)
  const doubleQuoteIndex = source.indexOf('"', fromIndex)
  if (singleQuoteIndex === -1) return doubleQuoteIndex
  if (doubleQuoteIndex === -1) return singleQuoteIndex
  return Math.min(singleQuoteIndex, doubleQuoteIndex)
}

function parseImportDeclarationAt(source: string, importIndex: number): ImportParseResult {
  if (!isImportKeywordAt(source, importIndex)) {
    return { nextCursor: importIndex + 6 }
  }

  const fromIndex = findImportFromIndex(source, importIndex + 6)
  if (fromIndex === -1) {
    return { nextCursor: importIndex + 6 }
  }

  const quoteIndex = findModuleQuoteIndex(source, fromIndex)
  const quote = source[quoteIndex]
  if (quote !== "'" && quote !== '"') {
    return { nextCursor: fromIndex + 4 }
  }

  const endQuoteIndex = source.indexOf(quote, quoteIndex + 1)
  if (endQuoteIndex === -1) {
    return { nextCursor: source.length }
  }

  return {
    declaration: {
      clause: source.slice(importIndex + 6, fromIndex).trim(),
      source: source.slice(quoteIndex + 1, endQuoteIndex),
    },
    nextCursor: endQuoteIndex + 1,
  }
}

function parseImportDeclarations(source: string): ImportDeclaration[] {
  const imports: ImportDeclaration[] = []
  let cursor = 0

  while (cursor < source.length) {
    const importIndex = source.indexOf('import', cursor)
    if (importIndex === -1) break
    const result = parseImportDeclarationAt(source, importIndex)
    if (result.declaration) imports.push(result.declaration)
    cursor = result.nextCursor
  }

  return imports
}

function collapseWhitespace(value: string): string {
  let result = ''
  let previousWasWhitespace = false

  for (const char of value) {
    if (isWhitespace(char)) {
      if (!previousWasWhitespace) result += ' '
      previousWasWhitespace = true
      continue
    }

    result += char
    previousWasWhitespace = false
  }

  return result.trim()
}

function stripTypePrefix(value: string): string {
  return value.startsWith('type ') ? value.slice(5) : value
}

function stripTrailingComma(value: string): string {
  return value.endsWith(',') ? value.slice(0, -1) : value
}

function parseSpecifier(specifier: string): { imported: string; local: string } | null {
  const normalized = stripTypePrefix(collapseWhitespace(specifier))
  if (!normalized) return null

  const aliasMarker = ' as '
  const aliasIndex = normalized.indexOf(aliasMarker)
  if (aliasIndex === -1) {
    return { imported: normalized, local: normalized }
  }

  const imported = normalized.slice(0, aliasIndex).trim()
  const local = normalized.slice(aliasIndex + aliasMarker.length).trim()
  return imported && local ? { imported, local } : null
}

function parseNamedSpecifiers(clause: string): Array<{ imported: string; local: string }> {
  const openIndex = clause.indexOf('{')
  const closeIndex = clause.lastIndexOf('}')
  if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) return []

  return clause
    .slice(openIndex + 1, closeIndex)
    .split(',')
    .map(parseSpecifier)
    .filter((specifier): specifier is { imported: string; local: string } => specifier !== null)
}

function parseDefaultImport(clause: string): string | null {
  const namedImportStart = clause.indexOf('{')
  const namespaceImportStart = clause.indexOf('*')
  const endIndex = [namedImportStart, namespaceImportStart]
    .filter(index => index >= 0)
    .sort((left, right) => left - right)[0]
  const defaultPart = stripTrailingComma(
    stripTypePrefix(collapseWhitespace(clause.slice(0, endIndex ?? clause.length)))
  ).trim()

  return defaultPart || null
}

function parseNamedImports(source: string): Map<string, string> {
  const imports = new Map<string, string>()

  for (const declaration of parseImportDeclarations(source)) {
    if (declaration.source !== REFERENCE_UI_REACT_IMPORT) continue
    for (const { imported, local } of parseNamedSpecifiers(declaration.clause)) {
      if (imported && local && primitiveNameSet.has(imported)) {
        imports.set(local, imported)
      }
    }
  }

  return imports
}

function parseNamespaceImports(source: string): string[] {
  const namespaces: string[] = []

  for (const declaration of parseImportDeclarations(source)) {
    if (declaration.source !== REFERENCE_UI_REACT_IMPORT) continue
    const clause = collapseWhitespace(declaration.clause)
    if (!clause.startsWith('* as ')) continue

    const namespace = clause.slice(5).trim()
    if (namespace) namespaces.push(namespace)
  }

  return namespaces
}

function parseNonReferenceImports(source: string): Set<string> {
  const imports = new Set<string>()

  for (const declaration of parseImportDeclarations(source)) {
    if (declaration.source === REFERENCE_UI_REACT_IMPORT) continue

    const defaultImport = parseDefaultImport(declaration.clause)
    if (defaultImport) imports.add(defaultImport)

    for (const { local } of parseNamedSpecifiers(declaration.clause)) {
      if (local) imports.add(local)
    }
  }

  return imports
}

function parseLocalDeclarations(source: string): Set<string> {
  const declarations = new Set<string>()
  const declarationPattern = /(?:function|class|const|let|var)\s+([A-Z][\w$]*)\b/g

  for (const match of source.matchAll(declarationPattern)) {
    if (match[1]) declarations.add(match[1])
  }

  return declarations
}

function isShadowedPrimitiveName(
  name: string,
  imports: Map<string, string>,
  nonReferenceImports: Set<string>,
  localDeclarations: Set<string>
): boolean {
  return !imports.has(name) && (nonReferenceImports.has(name) || localDeclarations.has(name))
}

function skipAttributeValue(source: string, start: number): number {
  let cursor = skipWhitespace(source, start)

  const quote = source[cursor]
  if (quote === '"' || quote === "'") {
    const endQuote = source.indexOf(quote, cursor + 1)
    return endQuote === -1 ? source.length : endQuote + 1
  }

  if (quote === '{') {
    const endBrace = source.indexOf('}', cursor + 1)
    return endBrace === -1 ? source.length : endBrace + 1
  }

  while (
    cursor < source.length &&
    !isWhitespace(source[cursor]) &&
    source[cursor] !== '/'
  ) {
    cursor += 1
  }

  return cursor
}

function readAttributeName(source: string, start: number): { name: string; end: number } {
  let cursor = skipWhitespace(source, start)
  const nameStart = cursor

  while (
    cursor < source.length &&
    !isWhitespace(source[cursor]) &&
    source[cursor] !== '=' &&
    source[cursor] !== '/'
  ) {
    cursor += 1
  }

  return {
    name: source.slice(nameStart, cursor),
    end: cursor === nameStart ? cursor + 1 : cursor,
  }
}

function nextAttributeCursor(source: string, cursor: number): number {
  const nextCursor = skipWhitespace(source, cursor)
  if (source[nextCursor] === '=') {
    return skipAttributeValue(source, nextCursor + 1)
  }
  return nextCursor
}

function extractAttributeNames(attributeSource: string): string[] {
  const names: string[] = []
  let cursor = 0

  while (cursor < attributeSource.length) {
    const attribute = readAttributeName(attributeSource, cursor)
    if (attribute.name && attribute.name !== 'as') names.push(attribute.name)
    cursor = nextAttributeCursor(attributeSource, attribute.end)
  }

  return names
}

function createElementSnippet(
  content: string,
  tagName: string,
  matchStart: number,
  openingTag: string
): string {
  if (openingTag.endsWith('/>')) {
    return openingTag.trim()
  }

  const closingTag = `</${tagName}>`
  const closingStart = content.indexOf(closingTag, matchStart + openingTag.length)
  if (closingStart === -1) {
    return openingTag.trim()
  }

  return content
    .slice(matchStart, closingStart + closingTag.length)
    .replace(/\s+/g, ' ')
    .trim()
}

function observeTag(input: ObserveTagInput): void {
  const { content, localName, primitiveName, observation, seenInFile } = input
  const tagPattern = new RegExp(`<\\s*${localName}\\b([^>]*)>`, 'g')

  for (const match of content.matchAll(tagPattern)) {
    const fullMatch = match[0] ?? ''
    const attributes = match[1] ?? ''
    const snippet = createElementSnippet(content, localName, match.index ?? 0, fullMatch)
    observation.count += 1
    seenInFile.add(primitiveName)

    if (observation.examples.length < 5) {
      observation.examples.push(snippet)
    }

    for (const attributeName of extractAttributeNames(attributes)) {
      increment(observation.propCounts, attributeName)
    }

    if (snippet !== fullMatch.trim()) {
      increment(observation.propCounts, 'children')
    }
  }
}

function observeImportedPrimitiveTags(
  content: string,
  imports: Map<string, string>,
  seenInFile: Set<string>,
  observations: Map<string, MutablePrimitiveObservation>
): void {
  for (const [localName, primitiveName] of imports) {
    observeTag({
      content,
      localName,
      primitiveName,
      observation: getOrCreateObservation(observations, primitiveName),
      seenInFile,
    })
  }
}

function observeFallbackPrimitiveTags(
  content: string,
  imports: Map<string, string>,
  seenInFile: Set<string>,
  observations: Map<string, MutablePrimitiveObservation>
): void {
  const nonReferenceImports = parseNonReferenceImports(content)
  const localDeclarations = parseLocalDeclarations(content)

  for (const primitiveName of REFERENCE_UI_PRIMITIVE_NAMES) {
    if (imports.has(primitiveName)) continue
    if (isShadowedPrimitiveName(primitiveName, imports, nonReferenceImports, localDeclarations)) {
      continue
    }

    observeTag({
      content,
      localName: primitiveName,
      primitiveName,
      observation: getOrCreateObservation(observations, primitiveName),
      seenInFile,
    })
  }
}

function observeNamespaceTag(input: ObserveTagInput & { namespace: string }): void {
  const { content, namespace, primitiveName, observation, seenInFile } = input
  const tagPattern = new RegExp(`<\\s*${namespace}\\.${primitiveName}\\b([^>]*)>`, 'g')

  for (const match of content.matchAll(tagPattern)) {
    const fullMatch = match[0] ?? ''
    const attributes = match[1] ?? ''
    const tagName = `${namespace}.${primitiveName}`
    const snippet = createElementSnippet(content, tagName, match.index ?? 0, fullMatch)
    observation.count += 1
    seenInFile.add(primitiveName)

    if (observation.examples.length < 5) {
      observation.examples.push(snippet)
    }

    for (const attributeName of extractAttributeNames(attributes)) {
      increment(observation.propCounts, attributeName)
    }

    if (snippet !== fullMatch.trim()) {
      increment(observation.propCounts, 'children')
    }
  }
}

function observeNamespacePrimitiveTags(
  content: string,
  namespaces: string[],
  seenInFile: Set<string>,
  observations: Map<string, MutablePrimitiveObservation>
): void {
  for (const namespace of namespaces) {
    for (const primitiveName of REFERENCE_UI_PRIMITIVE_NAMES) {
      observeNamespaceTag({
        content,
        namespace,
        primitiveName,
        localName: primitiveName,
        observation: getOrCreateObservation(observations, primitiveName),
        seenInFile,
      })
    }
  }
}

function recordFilePrimitivePresence(
  seenInFile: Set<string>,
  observations: Map<string, MutablePrimitiveObservation>
): void {
  for (const primitiveName of seenInFile) {
    const observation = observations.get(primitiveName)
    if (!observation) continue
    observation.filePresence += 1
    recordUsedWithCounts(primitiveName, seenInFile, observation)
  }
}

function recordUsedWithCounts(
  primitiveName: string,
  seenInFile: Set<string>,
  observation: MutablePrimitiveObservation
): void {
  for (const otherName of seenInFile) {
    if (otherName !== primitiveName) increment(observation.usedWithCounts, otherName)
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

function createPrimitiveObservationResult(
  name: string,
  observation: MutablePrimitiveObservation
): ReferenceUiPrimitiveObservation {
  return {
    name,
    count: observation.count,
    examples: observation.examples,
    filePresence: observation.filePresence,
    propCounts: Object.fromEntries(observation.propCounts),
    usedWithCounts: Object.fromEntries(observation.usedWithCounts),
  }
}

function getPrimitiveObservationResults(
  observations: Map<string, MutablePrimitiveObservation>
): ReferenceUiPrimitiveObservation[] {
  return Array.from(observations.entries())
    .filter(([, observation]) => observation.count > 0)
    .map(([name, observation]) => createPrimitiveObservationResult(name, observation))
}

function observePrimitiveUsageInContent(
  content: string,
  observations: Map<string, MutablePrimitiveObservation>
): void {
  const imports = parseNamedImports(content)
  const namespaces = parseNamespaceImports(content)
  const seenInFile = new Set<string>()

  observeImportedPrimitiveTags(content, imports, seenInFile, observations)
  observeFallbackPrimitiveTags(content, imports, seenInFile, observations)
  observeNamespacePrimitiveTags(content, namespaces, seenInFile, observations)
  recordFilePrimitivePresence(seenInFile, observations)
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
    observePrimitiveUsageInContent(content, observations)
  }

  return getPrimitiveObservationResults(observations)
}
