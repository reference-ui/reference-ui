/**
 * Liquid template loader and cache for layer CSS generation.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function hasTemplates(dir: string): boolean {
  return (
    existsSync(join(dir, 'layerCss.liquid')) &&
    existsSync(join(dir, 'runtimeStylesheet.liquid'))
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

function getLiquidDir(): string {
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
        join(dir, 'packages/reference-core/src/system/layers/liquid'),
        join(dir, 'src/system/layers/liquid'),
      ]

      for (const candidate of candidates) {
        if (hasTemplates(candidate)) {
          return candidate
        }
      }
    }
  }

  return join(process.cwd(), 'packages/reference-core/src/system/layers/liquid')
}

const __dirname = getLiquidDir()

interface Templates {
  layerCss: string
  runtimeStylesheet: string
}

let cachedTemplates: Templates | null = null

export function loadLayerTemplates(): Templates {
  if (cachedTemplates) {
    return cachedTemplates
  }

  cachedTemplates = {
    layerCss: readFileSync(join(__dirname, 'layerCss.liquid'), 'utf-8'),
    runtimeStylesheet: readFileSync(join(__dirname, 'runtimeStylesheet.liquid'), 'utf-8'),
  }

  return cachedTemplates
}
