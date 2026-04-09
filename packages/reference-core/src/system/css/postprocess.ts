import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type AtRule } from 'postcss'
import type { ReferenceUIConfig } from '../../config'
import { renderAssembledStylesheet } from './render/stylesheet'
import {
  createPortableResetStylesheet,
  createRuntimeResetStylesheet,
  shouldInjectReset,
} from './reset'
import { createPortableStylesheetFromContent } from './transform/createPortableStylesheetFromContent'

/** Default Panda CSS filename under outdir (e.g. outDir/styled/styles.css). */
export const PANDA_CSS_FILENAME = 'styles.css'
export const PANDA_GLOBAL_CSS_FILENAME = 'global.css'

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

function demoteGlobalCssLayer(rawCss: string, globalCss: string | undefined): string {
  const trimmedGlobalCss = globalCss?.trim()
  if (!trimmedGlobalCss) return rawCss

  const rawRoot = postcss.parse(rawCss)
  const globalRoot = postcss.parse(trimmedGlobalCss)
  const rawBaseLayer = findTopLevelLayerRule(rawRoot, 'base')
  const globalBaseLayer = findTopLevelLayerRule(globalRoot, 'base')
  if (!rawBaseLayer || !globalBaseLayer) return rawCss

  if (normalizeCssText(rawBaseLayer.toString()) !== normalizeCssText(globalBaseLayer.toString())) {
    return rawCss
  }

  rawBaseLayer.params = 'global'
  const layerOrder = findTopLevelLayerOrder(rawRoot)
  if (layerOrder) {
    layerOrder.params = insertGlobalIntoLayerOrder(layerOrder.params)
  }

  return rawRoot.toString()
}

/**
 * After Panda cssgen: derive portable CSS for the current system and, when
 * upstream systems expose precompiled CSS, rewrite the runtime stylesheet to
 * append upstream CSS in final source order.
 */
export function postprocessCss(
  outDir: string,
  config: ReferenceUIConfig,
): string | undefined {
  const styledDir = join(outDir, 'styled')
  const stylesPath = join(styledDir, PANDA_CSS_FILENAME)
  if (!existsSync(stylesPath)) return undefined
  const globalStylesPath = join(styledDir, PANDA_GLOBAL_CSS_FILENAME)

  const raw = readFileSync(stylesPath, 'utf-8')
  const demotedRaw = demoteGlobalCssLayer(
    raw,
    existsSync(globalStylesPath) ? readFileSync(globalStylesPath, 'utf-8') : undefined,
  )
  const portableStylesheet = createPortableStylesheetFromContent(demotedRaw, config.name)
  const portableWithReset = shouldInjectReset(config)
    ? `${createPortableResetStylesheet(config.name)}\n\n${portableStylesheet}`
    : portableStylesheet
  const runtimeWithReset = shouldInjectReset(config)
    ? `${createRuntimeResetStylesheet()}\n\n${demotedRaw}`
    : demotedRaw

  const upstreamSystems = [...(config.extends ?? []), ...(config.layers ?? [])]
    .map((layer) => {
      const css = layer.css?.trim()
      return css ? { name: layer.name, css } : undefined
    })
    .filter((layer): layer is { name: string; css: string } => Boolean(layer))
  if (upstreamSystems.length === 0) {
    if (runtimeWithReset !== raw) {
      writeFileSync(stylesPath, runtimeWithReset, 'utf-8')
    }
    return portableWithReset
  }

  const finalCss = renderAssembledStylesheet(config.name, portableWithReset, upstreamSystems)

  writeFileSync(stylesPath, finalCss, 'utf-8')
  return finalCss
}
