import manifest from '../../../workers.json'

/**
 * Build entries for tsup (from workers.json). Kept in a module with **no** imports of `run.ts` /
 * Piscina / profiler so `tsup.config.ts` can load it without keeping the process alive after build.
 */
export const workerEntries = Object.fromEntries(
  Object.entries(manifest as Record<string, string>).map(([name, src]) => [
    `${name}/worker`,
    src,
  ]),
)
