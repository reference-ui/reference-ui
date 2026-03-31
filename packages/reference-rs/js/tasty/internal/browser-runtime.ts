import type { CreateTastyBrowserRuntimeOptions, TastyApi, TastyBrowserRuntime, TastyRuntimeModule } from '../api-types'
import { extractTastyRuntimeModule, wrapRuntimeError } from './shared'
import { createTastyApiFromManifest } from './api-runtime'

export class TastyBrowserRuntimeImpl implements TastyBrowserRuntime {
  private runtimeModulePromise: Promise<TastyRuntimeModule> | undefined
  private runtimeModule: TastyRuntimeModule | undefined
  private apiPromise: Promise<TastyApi> | undefined
  private api: TastyApi | undefined

  constructor(private readonly options: CreateTastyBrowserRuntimeOptions) {}

  async ready(): Promise<void> {
    await this.loadApi()
  }

  getApi(): TastyApi | undefined {
    return this.api
  }

  async loadRuntimeModule(): Promise<TastyRuntimeModule> {
    if (!this.runtimeModulePromise) {
      this.runtimeModulePromise = Promise.resolve()
        .then(() => this.options.loadRuntimeModule())
        .then((moduleValue) => {
          const runtimeModule = extractTastyRuntimeModule(moduleValue)
          this.runtimeModule = runtimeModule
          return runtimeModule
        })
        .catch((error: unknown) => {
          this.runtimeModulePromise = undefined
          this.runtimeModule = undefined
          throw wrapRuntimeError('Failed to load Tasty browser runtime module.', error)
        })
    }

    return this.runtimeModulePromise
  }

  async loadApi(): Promise<TastyApi> {
    if (!this.apiPromise) {
      this.apiPromise = this.loadRuntimeModule()
        .then(async (runtimeModule) => {
          const api = createTastyApiFromManifest({
            manifest: runtimeModule.manifest,
            manifestPath: runtimeModule.manifestUrl,
            importer: runtimeModule.importTastyArtifact,
          })
          await api.ready()
          this.api = api
          return api
        })
        .catch((error: unknown) => {
          this.apiPromise = undefined
          this.api = undefined
          throw error
        })
    }

    return this.apiPromise
  }
}

export function createTastyBrowserRuntime(
  options: CreateTastyBrowserRuntimeOptions,
): TastyBrowserRuntime {
  return new TastyBrowserRuntimeImpl(options)
}
