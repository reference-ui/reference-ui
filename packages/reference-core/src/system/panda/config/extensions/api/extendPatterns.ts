import type { Config } from '@pandacss/dev'
import type { BoxPatternExtension } from '../../../../api/patterns'
import { resolvePandaJsxElements } from '../../jsx-elements'
import { deepMerge, getPandaConfig, toRecord, type RuntimeStore } from './runtime'

function getTransformBody(transform: BoxPatternExtension['transform']): string {
  const source = transform.toString()
  const bodyStart = source.indexOf('{')
  const bodyEnd = source.lastIndexOf('}')

  if (bodyStart < 0 || bodyEnd <= bodyStart) {
    return ''
  }

  return source.slice(bodyStart + 1, bodyEnd).trim()
}

function createBoxTransform(
  extensions: BoxPatternExtension[],
  additionalJsxElements: string[]
) {
  const properties = Object.assign(
    {},
    ...extensions.map((extension) => extension.properties)
  ) as Record<string, unknown>
  const blocklist = Object.keys(properties)
  const resultVars = extensions.map((_, index) => `_r${index}`)

  const transformBlocks = extensions.map((extension, index) => {
    const body = getTransformBody(extension.transform)
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n')

    return [`const _r${index} = (function(props) {`, body, `})(props)`].join('\n')
  })

  const transformSource = [
    'return function transform(props) {',
    `  const blocklist = ${JSON.stringify(blocklist)}`,
    '  const extensionKeys = new Set(blocklist)',
    '  const rest = Object.fromEntries(',
    '    Object.entries(props).filter(([key]) => !extensionKeys.has(key))',
    '  )',
    '',
    ...transformBlocks.map((block) =>
      block
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')
    ),
    '',
    `  return Object.assign({}, ${resultVars.join(', ')}, rest)`,
    '}',
  ].join('\n')

  const transform = new Function(transformSource)() as (
    props: Record<string, unknown>
  ) => Record<string, unknown>

  return {
    jsx: resolvePandaJsxElements(additionalJsxElements),
    properties,
    blocklist,
    transform,
  }
}

export function extendPatterns(
  extensions: BoxPatternExtension[],
  additionalJsxElements: string[] = []
): Partial<Config> {
  if (extensions.length === 0) {
    return getPandaConfig()
  }

  const pandaConfig = getPandaConfig() as RuntimeStore
  const boxPattern = createBoxTransform(extensions, additionalJsxElements)

  pandaConfig.patterns = deepMerge({}, toRecord(pandaConfig.patterns), {
    extend: {
      box: boxPattern,
    },
  })

  return pandaConfig as Partial<Config>
}
