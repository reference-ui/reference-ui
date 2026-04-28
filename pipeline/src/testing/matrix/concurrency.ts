import { availableParallelism } from 'node:os'

export interface ResolveMatrixPackageConcurrencyOptions {
  configuredConcurrency: number
  hostParallelism?: number
  runtimeCpuCount?: number | null
  totalPackages: number
}

export interface MatrixConcurrencyResolution {
  concurrency: number
  configuredConcurrency: number
  hostParallelism: number
  runtimeCpuCount: number | null
  totalPackages: number
}

function normalizePositiveInteger(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  const normalized = Math.floor(value)
  return normalized >= 1 ? normalized : null
}

export function resolveMatrixPackageConcurrency(
  options: ResolveMatrixPackageConcurrencyOptions,
): MatrixConcurrencyResolution {
  const configuredConcurrency = Math.max(1, Math.floor(options.configuredConcurrency))
  const hostParallelism = Math.max(1, Math.floor(options.hostParallelism ?? availableParallelism()))
  const runtimeCpuCount = normalizePositiveInteger(options.runtimeCpuCount)
  const runtimeParallelismCap = runtimeCpuCount === null
    ? hostParallelism
    : Math.min(hostParallelism, runtimeCpuCount)

  return {
    concurrency: Math.min(options.totalPackages, configuredConcurrency, runtimeParallelismCap),
    configuredConcurrency,
    hostParallelism,
    runtimeCpuCount,
    totalPackages: options.totalPackages,
  }
}