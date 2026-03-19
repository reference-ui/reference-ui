import { Liquid } from 'liquidjs'
import { loadLayerTemplates } from './liquid'

const engine = new Liquid()

export interface LayerTokenBlock {
  selector: string
  declarations: string
}

interface RenderLayerCssOptions {
  layerName: string
  content: string
  rootTokenDeclarations: string
  themeTokenBlocks: LayerTokenBlock[]
}

export function renderLayerCss(options: RenderLayerCssOptions): string {
  const templates = loadLayerTemplates()
  return engine.parseAndRenderSync(templates.layerCss, options).trim()
}

export function renderLayerStylesheet(
  localLayerName: string,
  localLayerCss: string,
  upstreamLayers: Array<{ name: string; css: string }>
): string {
  const templates = loadLayerTemplates()
  const layerOrder = [...upstreamLayers.map((layer) => layer.name), localLayerName]
  return engine
    .parseAndRenderSync(templates.runtimeStylesheet, {
      layerOrder,
      localLayerCss,
      upstreamLayerCss: upstreamLayers.map((layer) => layer.css).join('\n\n'),
    })
    .trim()
}
