import { Liquid } from 'liquidjs'
import { loadCssTemplates } from '../templates'

const engine = new Liquid()

export interface LayerTokenBlock {
  selector: string
  declarations: string
}

interface RenderPortableStylesheetOptions {
  layerName: string
  content: string
  rootTokenDeclarations: string
  themeTokenBlocks: LayerTokenBlock[]
}

export function renderPortableStylesheet(options: RenderPortableStylesheetOptions): string {
  const templates = loadCssTemplates()
  return engine.parseAndRenderSync(templates.portableStylesheet, options).trim()
}

export function renderAssembledStylesheet(
  localLayerName: string,
  localPortableStylesheet: string,
  upstreamLayers: Array<{ name: string; css: string }>,
): string {
  const templates = loadCssTemplates()
  const layerOrder = [...upstreamLayers.map((layer) => layer.name), localLayerName]
  return engine
    .parseAndRenderSync(templates.assembledStylesheet, {
      layerOrder,
      localPortableStylesheet,
      upstreamLayerCss: upstreamLayers.map((layer) => layer.css).join('\n\n'),
    })
    .trim()
}
