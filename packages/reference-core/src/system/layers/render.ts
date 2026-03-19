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
  localLayerCss: string,
  upstreamLayerCss: string[]
): string {
  const templates = loadLayerTemplates()
  return engine
    .parseAndRenderSync(templates.runtimeStylesheet, {
      localLayerCss,
      upstreamLayerCss: upstreamLayerCss.join('\n\n'),
    })
    .trim()
}
