/**
 * Render box pattern to fragment string via Liquid template.
 * Transforms collected extensions into the push-to-collector format.
 */

import { Liquid } from 'liquidjs'
import { COLLECTOR_KEY } from '../collectors/extendPandaConfig'
import { loadPatternTemplates } from './liquid'
import type { BoxPatternExtension } from '../collectors/extendPattern'
import type { RenderBoxPatternOptions } from './types'

const engine = new Liquid()

export type { RenderBoxPatternOptions } from './types'

/**
 * Convert extension transform to IIFE string for inlining.
 * Transforms must be self-contained (no closures) for Panda codegen.
 */
function transformToIIFE(ext: BoxPatternExtension, index: number): string {
  const fnStr = ext.transform.toString()
  const bodyStart = fnStr.indexOf('{')
  const bodyEnd = fnStr.lastIndexOf('}')
  const fnBody =
    bodyStart >= 0 && bodyEnd > bodyStart
      ? fnStr.slice(bodyStart + 1, bodyEnd).trim()
      : ''

  const lines = fnBody.split('\n').map((line) => '    ' + line)

  return [`  const _r${index} = (function(props) {`, ...lines, `  })(props)`].join('\n')
}

/**
 * Render merged box pattern extensions to a fragment string.
 * Uses the Liquid template for clear separation of structure from logic.
 */
export async function renderBoxPattern(
  options: RenderBoxPatternOptions
): Promise<string> {
  const { extensions, collectorKey = COLLECTOR_KEY } = options

  if (extensions.length === 0) {
    return ''
  }

  const properties: Record<string, unknown> = {}
  for (const ext of extensions) {
    Object.assign(properties, ext.properties)
  }

  const blocklist = Object.keys(properties)
  const blocklistStr = JSON.stringify(blocklist)

  const transformIIFEs = extensions
    .map((ext, i) => transformToIIFE(ext, i))
    .join('\n')

  const resultVars = extensions.map((_, i) => `_r${i}`).join(', ')

  const propertiesStr = Object.entries(properties)
    .map(([k, v]) => `          ${k}: ${JSON.stringify(v)}`)
    .join(',\n')

  const templates = loadPatternTemplates()

  const rendered = await engine.parseAndRender(templates.boxPattern, {
    collectorKey,
    propertiesStr,
    blocklistStr,
    transformIIFEs,
    resultVars,
  })

  return rendered.trim()
}
