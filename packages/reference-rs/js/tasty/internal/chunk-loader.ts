import {
  normalizeModuleNamespace,
  resolveArtifactPath,
  type ArtifactImporter,
  type ModuleNamespace,
} from './shared'

interface ChunkLoaderOptions {
  manifestPath?: string
  importer: ArtifactImporter
  wrapChunkLoadError: (relativeChunkPath: string, resolvedChunkPath: string, error: unknown) => Error
}

export class ChunkLoader {
  private readonly chunkCache = new Map<string, Promise<ModuleNamespace>>()

  constructor(private readonly options: ChunkLoaderOptions) {}

  async loadChunk(relativeChunkPath: string): Promise<ModuleNamespace> {
    const resolvedChunkPath = this.options.manifestPath
      ? await resolveArtifactPath(this.options.manifestPath, relativeChunkPath)
      : relativeChunkPath

    let cached = this.chunkCache.get(resolvedChunkPath)
    if (!cached) {
      cached = this.options.importer(resolvedChunkPath)
        .then((moduleValue) => normalizeModuleNamespace(moduleValue))
        .catch((error: unknown) => {
          this.chunkCache.delete(resolvedChunkPath)
          throw this.options.wrapChunkLoadError(relativeChunkPath, resolvedChunkPath, error)
        })
      this.chunkCache.set(resolvedChunkPath, cached)
    }

    return cached
  }

  async prefetchChunk(relativeChunkPath: string): Promise<void> {
    await this.loadChunk(relativeChunkPath)
  }
}