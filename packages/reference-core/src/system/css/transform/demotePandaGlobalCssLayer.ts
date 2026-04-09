import postcss, { type AtRule } from 'postcss'

function normalizeCssText(value: string): string {
  return value.replace(/\s+/g, '').trim()
}

function findTopLevelLayerRule(root: postcss.Root, layerName: string): AtRule | undefined {
  return root.nodes.find(
    (node): node is AtRule =>
      node.type === 'atrule' &&
      node.name === 'layer' &&
      node.nodes != null &&
      node.params.trim() === layerName,
  )
}

function findTopLevelLayerOrder(root: postcss.Root): AtRule | undefined {
  return root.nodes.find(
    (node): node is AtRule =>
      node.type === 'atrule' &&
      node.name === 'layer' &&
      node.nodes == null,
  )
}

function insertGlobalIntoLayerOrder(params: string): string {
  const layerNames = params
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  if (layerNames.includes('global')) return layerNames.join(', ')

  const baseIndex = layerNames.indexOf('base')
  if (baseIndex === -1) {
    return ['global', ...layerNames].join(', ')
  }

  layerNames.splice(baseIndex, 0, 'global')
  return layerNames.join(', ')
}

function createContractError(message: string): Error {
  return new Error(`Panda global.css contract changed: ${message}`)
}

/**
 * Move Panda's standalone global.css base layer into a dedicated lower-priority
 * "global" layer inside the combined styles.css artifact.
 *
 * This is intentionally strict: if Panda changes the emitted shape, we should
 * fail loudly instead of silently regressing the cascade contract.
 */
export function demotePandaGlobalCssLayer(rawCss: string, globalCss: string | undefined): string {
  const trimmedGlobalCss = globalCss?.trim()
  if (!trimmedGlobalCss) return rawCss

  const rawRoot = postcss.parse(rawCss)
  const globalRoot = postcss.parse(trimmedGlobalCss)
  const rawBaseLayer = findTopLevelLayerRule(rawRoot, 'base')
  const globalBaseLayer = findTopLevelLayerRule(globalRoot, 'base')

  if (!rawBaseLayer) {
    throw createContractError('expected a top-level @layer base block in styles.css')
  }

  if (!globalBaseLayer) {
    throw createContractError('expected a top-level @layer base block in global.css')
  }

  if (normalizeCssText(rawBaseLayer.toString()) !== normalizeCssText(globalBaseLayer.toString())) {
    throw createContractError('expected styles.css base layer to match global.css exactly')
  }

  const layerOrder = findTopLevelLayerOrder(rawRoot)
  if (!layerOrder) {
    throw createContractError('expected a top-level @layer order declaration in styles.css')
  }

  rawBaseLayer.params = 'global'
  layerOrder.params = insertGlobalIntoLayerOrder(layerOrder.params)

  return rawRoot.toString()
}