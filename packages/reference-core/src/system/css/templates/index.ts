/**
 * Liquid template loader and cache for CSS generation.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function hasTemplates(dir: string): boolean {
  return (
    existsSync(join(dir, 'portableStylesheet.liquid')) &&
    existsSync(join(dir, 'assembledStylesheet.liquid'))
  )
}

function* ancestorDirs(startDir: string): Generator<string> {
  let current = startDir
  while (true) {
    yield current
    const parent = dirname(current)
    if (parent === current) {
      break
    }
    current = parent
  }
}

function getTemplatesDir(): string {
  const searchRoots: string[] = []

  try {
    const url = (import.meta as { url?: string }).url
    if (url) {
      searchRoots.push(dirname(fileURLToPath(url)))
    }
  } catch {
    /* ignore */
  }

  searchRoots.push(process.cwd())

  for (const root of searchRoots) {
    for (const dir of ancestorDirs(root)) {
      const candidates = [
        join(dir, 'packages/reference-core/src/system/css/templates'),
        join(dir, 'src/system/css/templates'),
      ]

      for (const candidate of candidates) {
        if (hasTemplates(candidate)) {
          return candidate
        }
      }
    }
  }

  return join(process.cwd(), 'packages/reference-core/src/system/css/templates')
}

const templatesDir = getTemplatesDir()

interface Templates {
  portableStylesheet: string
  assembledStylesheet: string
}

let cachedTemplates: Templates | null = null

export function loadCssTemplates(): Templates {
  if (cachedTemplates) {
    return cachedTemplates
  }

  cachedTemplates = {
    portableStylesheet: readFileSync(join(templatesDir, 'portableStylesheet.liquid'), 'utf-8'),
    assembledStylesheet: readFileSync(join(templatesDir, 'assembledStylesheet.liquid'), 'utf-8'),
  }

  return cachedTemplates
}
