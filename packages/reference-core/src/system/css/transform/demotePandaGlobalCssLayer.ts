import postcss, { type AtRule } from 'postcss'

export class PandaCssContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PandaCssContractError'
  }
}

export function isPandaCssContractError(error: unknown): error is PandaCssContractError {
  return (
    error instanceof PandaCssContractError ||
    (error instanceof Error && error.name === 'PandaCssContractError')
  )
}

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

function layerOrderIncludes(layerOrder: AtRule, layerName: string): boolean {
  return layerOrder.params
    .split(',')
    .map((name) => name.trim())
    .includes(layerName)
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
  return new PandaCssContractError(`Panda global.css contract changed: ${message}`)
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
  const rawGlobalLayer = findTopLevelLayerRule(rawRoot, 'global')
  const globalBaseLayer = findTopLevelLayerRule(globalRoot, 'base')
  const layerOrder = findTopLevelLayerOrder(rawRoot)

  if (!layerOrder) {
    throw createContractError('expected a top-level @layer order declaration in styles.css')
  }

  if (!globalBaseLayer) {
    throw createContractError('expected a top-level @layer base block in global.css')
  }

  if (!rawBaseLayer) {
    // In watch mode, styles.css may already be the previously postprocessed artifact.
    // Treat a matching top-level global layer as an idempotent no-op instead of a contract failure.
    if (rawGlobalLayer && layerOrderIncludes(layerOrder, 'global')) {
      const normalizedRawGlobalAsBase = normalizeCssText(
        rawGlobalLayer.clone({ params: 'base' }).toString(),
      )
      if (normalizedRawGlobalAsBase === normalizeCssText(globalBaseLayer.toString())) {
        return rawCss
      }
    }

    throw createContractError('expected a top-level @layer base block in styles.css')
  }

  if (normalizeCssText(rawBaseLayer.toString()) !== normalizeCssText(globalBaseLayer.toString())) {
    throw createContractError('expected styles.css base layer to match global.css exactly')
  }

  rawBaseLayer.params = 'global'
  layerOrder.params = insertGlobalIntoLayerOrder(layerOrder.params)

  return rawRoot.toString()
}