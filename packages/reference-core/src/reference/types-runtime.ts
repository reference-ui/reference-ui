import manifest from './manifest.js'

export { manifest }

export const manifestUrl = new URL('./manifest.js', import.meta.url).href

export async function importTastyArtifact(specifier: string): Promise<unknown> {
  return import(/* @vite-ignore */ specifier)
}
