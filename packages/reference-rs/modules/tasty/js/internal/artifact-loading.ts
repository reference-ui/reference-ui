/**
 * Artifact path resolution and module importing for the runtime.
 * Resolves artifact paths and specifiers and imports artifact modules. Each file import gets a
 * fresh query, so a rebuilt artifact is read again instead of the cached module.
 */
import { wrapRuntimeError } from './runtime-errors.js'

export type ArtifactImporter = (artifactPath: string) => Promise<unknown>

let artifactImportVersion = 0

export async function defaultArtifactImporter(artifactPath: string): Promise<unknown> {
  const specifier = await resolveArtifactSpecifier(artifactPath)
  return import(/* @vite-ignore */ withFreshFileSpecifier(specifier))
}

export async function resolveArtifactPath(
  basePath: string,
  relativePath: string
): Promise<string> {
  if (relativePath.startsWith('./') || relativePath.startsWith('../')) {
    const baseSpecifier = await resolveArtifactSpecifier(basePath)
    try {
      return new URL(relativePath, baseSpecifier).href
    } catch (error: unknown) {
      throw wrapRuntimeError(
        `Could not resolve Tasty artifact path "${relativePath}" relative to "${basePath}".`,
        error
      )
    }
  }
  return relativePath
}

export async function resolveArtifactSpecifier(pathOrSpecifier: string): Promise<string> {
  if (isUrlLike(pathOrSpecifier)) {
    return pathOrSpecifier
  }

  const { pathToFileURL } = await import('node:url')
  return pathToFileURL(pathOrSpecifier).href
}

function withFreshFileSpecifier(specifier: string): string {
  if (!specifier.startsWith('file:')) {
    return specifier
  }

  const url = new URL(specifier)
  url.searchParams.set('tastyv', String(++artifactImportVersion))
  return url.href
}

export function isUrlLike(value: string): boolean {
  return (
    value.startsWith('file:') ||
    value.startsWith('http:') ||
    value.startsWith('https:') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  )
}
