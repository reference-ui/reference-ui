/**
 * Artifact path resolution and module importing for the runtime.
 * Resolves artifact paths and specifiers and imports artifact modules. Each file import carries a
 * hash of the file's bytes as its query, so a rebuilt artifact is read again while an unchanged one
 * reuses the module Node already holds: Node keeps every module record for the life of the process,
 * and a fresh query per import grew a long watch by every manifest it ever loaded.
 */
import { wrapRuntimeError } from './runtime-errors.js'

export type ArtifactImporter = (artifactPath: string) => Promise<unknown>

export async function defaultArtifactImporter(artifactPath: string): Promise<unknown> {
  const specifier = await resolveArtifactSpecifier(artifactPath)
  return import(/* @vite-ignore */ await withContentFileSpecifier(specifier))
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

// An unreadable file keeps its plain specifier, so the import reports the missing artifact itself.
async function withContentFileSpecifier(specifier: string): Promise<string> {
  if (!specifier.startsWith('file:')) {
    return specifier
  }

  const url = new URL(specifier)
  const [{ readFile }, { createHash }] = await Promise.all([import('node:fs/promises'), import('node:crypto')])
  let bytes: Uint8Array
  try {
    bytes = await readFile(url)
  } catch {
    return specifier
  }
  url.searchParams.set('tastyv', createHash('sha256').update(bytes).digest('hex').slice(0, 16))
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
