import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReferenceUIConfig } from '../../../config'
import {
  createPortableResetStylesheet,
  createRuntimeResetStylesheet,
  shouldInjectReset,
} from '../reset'
import { demotePandaGlobalCssLayer } from '../transform/demotePandaGlobalCssLayer'
import { createPortableStylesheetFromContent } from '../transform/createPortableStylesheetFromContent'

export interface PandaCssArtifacts {
  stylesPath: string
  rawCss: string
  globalCss?: string
}

export interface UserSpaceAndDownstreamCss {
  userSpaceCss: string
  downstreamCss: string
}

export function readPandaCssArtifacts(
  outDir: string,
  stylesFilename: string,
  globalStylesFilename: string,
): PandaCssArtifacts | undefined {
  const styledDir = join(outDir, 'styled')
  const stylesPath = join(styledDir, stylesFilename)
  if (!existsSync(stylesPath)) return undefined

  const globalStylesPath = join(styledDir, globalStylesFilename)

  return {
    stylesPath,
    rawCss: readFileSync(stylesPath, 'utf-8'),
    globalCss: existsSync(globalStylesPath) ? readFileSync(globalStylesPath, 'utf-8') : undefined,
  }
}

export function createLocalPostprocessedStylesheets(
  config: ReferenceUIConfig,
  artifacts: PandaCssArtifacts,
): UserSpaceAndDownstreamCss {
  // Normalize Panda's local output so user-space and downstream CSS share the same layer contract.
  const localCss = demotePandaGlobalCssLayer(artifacts.rawCss, artifacts.globalCss)

  // Downstream CSS must be self-contained so other systems can append it as an upstream layer.
  const downstreamStylesheet = createPortableStylesheetFromContent(localCss, config.name)
  const injectReset = shouldInjectReset(config)

  // Downstream consumers need the reset scoped to this system layer.
  const downstreamCss = injectReset
    ? `${createPortableResetStylesheet(config.name)}\n\n${downstreamStylesheet}`
    : downstreamStylesheet

  // User space gets the unscoped runtime reset because this file is written directly to the current build.
  const userSpaceCss = injectReset
    ? `${createRuntimeResetStylesheet()}\n\n${localCss}`
    : localCss

  return {
    downstreamCss,
    userSpaceCss,
  }
}

export function collectUpstreamSystems(config: ReferenceUIConfig): Array<{ name: string; css: string }> {
  // Both extends and layers can contribute precompiled upstream CSS during final assembly.
  return [...(config.extends ?? []), ...(config.layers ?? [])]
    .map((layer) => {
      const css = layer.css?.trim()
      return css ? { name: layer.name, css } : undefined
    })
    .filter((layer): layer is { name: string; css: string } => Boolean(layer))
}