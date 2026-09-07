import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { McpComponentAnatomy, McpComponentAnatomyPart } from './types'

export interface ExtractedComponentDoc {
  name: string
  description: string | null
  examples: string[]
  anatomy: McpComponentAnatomy | null
}

const docCache = new Map<string, ExtractedComponentDoc | null>()

function cleanMarkdownLink(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

export function parseComponentDoc(
  content: string,
  componentName: string,
  sourceContent?: string
): ExtractedComponentDoc {
  const lines = content.split(/\r?\n/)
  let description: string | null = null
  const examples: string[] = []

  let inCode = false
  let currentCodeLines: string[] = []
  let currentCodeLang = ''
  const paragraphLines: string[] = []
  let inFrontmatter = false
  let frontmatterDesc: string | null = null

  if (lines[0]?.trim() === '---') {
    inFrontmatter = true
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (inFrontmatter) {
      if (i > 0 && trimmed === '---') {
        inFrontmatter = false
      } else {
        const descMatch = trimmed.match(/^description:\s*["']?([^"']+)["']?$/i)
        if (descMatch) {
          frontmatterDesc = descMatch[1].trim()
        }
      }
      continue
    }

    // Detect code fence start
    const fenceMatch = trimmed.match(/^```([a-zA-Z0-9_-]+)?/)
    if (fenceMatch && !inCode) {
      inCode = true
      currentCodeLang = (fenceMatch[1] || '').toLowerCase()
      currentCodeLines = []
      continue
    }

    // Detect code fence end
    if (inCode && trimmed.startsWith('```')) {
      inCode = false
      if (
        currentCodeLang === 'tsx' ||
        currentCodeLang === 'jsx' ||
        currentCodeLang === 'ts' ||
        currentCodeLang === 'react' ||
        !currentCodeLang
      ) {
        const snippet = currentCodeLines.join('\n').trim()
        const isTypeDeclaration =
          snippet.startsWith('interface ') || snippet.startsWith('type ')
        const hasUsageOrJsx =
          snippet.includes('<') ||
          snippet.includes('toast.') ||
          snippet.includes('import ') ||
          snippet.includes('export ')
        if (snippet && !isTypeDeclaration && hasUsageOrJsx) {
          examples.push(snippet)
        }
      }
      continue
    }

    if (inCode) {
      currentCodeLines.push(rawLine)
      continue
    }

    // Capture first substantive paragraph as description if not already set
    if (!description && !examples.length) {
      if (
        trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('Proof:') &&
        !trimmed.startsWith('>') &&
        !trimmed.startsWith('---') &&
        !trimmed.startsWith('<!--') &&
        !trimmed.startsWith('|')
      ) {
        paragraphLines.push(trimmed)
      } else if (paragraphLines.length > 0) {
        description = cleanMarkdownLink(paragraphLines.join(' '))
      }
    }
  }

  if (!description && paragraphLines.length > 0) {
    description = cleanMarkdownLink(paragraphLines.join(' '))
  }

  if (!description && frontmatterDesc) {
    description = frontmatterDesc
  }

  // Extract anatomy parts:
  // 1. Scan JSX code blocks for `<ComponentName.PartName`
  // 2. Scan text for `ComponentName.PartName`
  const partMap = new Map<string, McpComponentAnatomyPart>()
  const tagRegex = new RegExp(`<(${componentName}\\.([A-Za-z0-9_]+))([^>]*)`, 'g')

  for (const example of examples) {
    let match: RegExpExecArray | null
    while ((match = tagRegex.exec(example)) !== null) {
      const fullName = match[1]
      const partName = match[2]
      const propAttrs = match[3] || ''

      const existing = partMap.get(partName) || {
        name: fullName,
        tag: `<${fullName}>`,
        requiredProps: [],
      }

      // Extract attribute names
      const attrMatches = Array.from(propAttrs.matchAll(/([a-zA-Z0-9_-]+)(?:=|\s|$)/g))
        .map(m => m[1])
        .filter(attr => !['className', 'style', 'key', 'ref', 'children'].includes(attr))

      for (const attr of attrMatches) {
        if (!existing.requiredProps?.includes(attr)) {
          // Identify key props like id, value, min, defaultSize, collapsible, placement
          if (['id', 'value', 'orientation', 'min', 'defaultSize', 'checked', 'open', 'placement'].includes(attr)) {
            existing.requiredProps = [...(existing.requiredProps || []), attr]
          }
        }
      }

      partMap.set(partName, existing)
    }
  }

  // Also scan markdown text for references like `ComponentName.Part` renders ...
  const textPartRegex = new RegExp(`\`${componentName}\\.([A-Za-z0-9_]+)\`\\s+(renders[^.]*\\.)`, 'gi')
  let textMatch: RegExpExecArray | null
  while ((textMatch = textPartRegex.exec(content)) !== null) {
    const partName = textMatch[1]
    const partDesc = textMatch[2].trim()
    const existing = partMap.get(partName) || {
      name: `${componentName}.${partName}`,
      tag: `<${componentName}.${partName}>`,
      requiredProps: [],
    }
    existing.description = partDesc
    partMap.set(partName, existing)
  }

  // If source TSX/TS content provided, scan for static member assignments (e.g. Accordion.Item = AccordionItem)
  if (sourceContent) {
    const staticAssignRegex = new RegExp(`^\\s*${componentName}\\.([A-Za-z0-9_]+)\\s*=`, 'gm')
    let staticMatch: RegExpExecArray | null
    while ((staticMatch = staticAssignRegex.exec(sourceContent)) !== null) {
      const partName = staticMatch[1]
      if (!partMap.has(partName)) {
        partMap.set(partName, {
          name: `${componentName}.${partName}`,
          tag: `<${componentName}.${partName}>`,
          requiredProps: [],
        })
      }
    }
  }

  const parts = Array.from(partMap.values())
  const anatomy: McpComponentAnatomy =
    parts.length > 0
      ? {
          pattern: 'compound',
          root: componentName,
          parts,
        }
      : {
          pattern: 'single',
          root: componentName,
          parts: [],
        }

  return {
    name: componentName,
    description: description || null,
    examples,
    anatomy,
  }
}

export function loadComponentDocFromFile(
  filePath: string,
  componentName: string
): ExtractedComponentDoc | null {
  const cached = docCache.get(filePath)
  if (cached !== undefined) return cached

  if (!existsSync(filePath)) {
    docCache.set(filePath, null)
    return null
  }

  try {
    const content = readFileSync(filePath, 'utf8')
    const dir = dirname(filePath)
    let sourceContent: string | undefined
    const tsxCandidate = join(dir, `${componentName}.tsx`)
    const tsCandidate = join(dir, `${componentName}.ts`)
    if (existsSync(tsxCandidate)) {
      sourceContent = readFileSync(tsxCandidate, 'utf8')
    } else if (existsSync(tsCandidate)) {
      sourceContent = readFileSync(tsCandidate, 'utf8')
    }

    const parsed = parseComponentDoc(content, componentName, sourceContent)
    docCache.set(filePath, parsed)
    return parsed
  } catch {
    docCache.set(filePath, null)
    return null
  }
}

export function findComponentDoc(
  cwd: string,
  componentName: string,
  sourcePath?: string
): ExtractedComponentDoc | null {
  const cacheKey = `${cwd}:${componentName}:${sourcePath ?? ''}`
  const cached = docCache.get(cacheKey)
  if (cached !== undefined) return cached

  const candidates: string[] = []

  // If sourcePath provided, check its adjacent directory
  if (sourcePath) {
    const resolvedSource = resolve(cwd, sourcePath)
    const sourceDir = dirname(resolvedSource)
    candidates.push(
      join(sourceDir, `${componentName}.md`),
      join(sourceDir, `${componentName}.mdx`),
      join(sourceDir, 'README.md')
    )

    const resolvedSrcSource = resolve(cwd, 'src', sourcePath)
    const srcSourceDir = dirname(resolvedSrcSource)
    candidates.push(
      join(srcSourceDir, `${componentName}.md`),
      join(srcSourceDir, `${componentName}.mdx`),
      join(srcSourceDir, 'README.md')
    )
  }

  // Check standard project component directories
  candidates.push(
    resolve(cwd, 'src/components', componentName, `${componentName}.md`),
    resolve(cwd, 'src/components', componentName, `${componentName}.mdx`),
    resolve(cwd, 'components', componentName, `${componentName}.md`),
    resolve(cwd, 'components', componentName, `${componentName}.mdx`),
    resolve(cwd, 'src', `${componentName}.md`),
    resolve(cwd, `${componentName}.md`)
  )

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const doc = loadComponentDocFromFile(candidate, componentName)
      if (doc) {
        docCache.set(cacheKey, doc)
        return doc
      }
    }
  }

  docCache.set(cacheKey, null)
  return null
}

export function clearComponentDocCache(): void {
  docCache.clear()
}
