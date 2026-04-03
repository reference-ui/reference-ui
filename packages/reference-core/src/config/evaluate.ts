/**
 * Evaluate the bundled user config as an in-memory ESM module.
 *
 * The config bundle is emitted as ESM so dependencies that rely on `import.meta`
 * keep working during config evaluation.
 *
 * @param bundledCode - The bundled JavaScript string (ESM format)
 * @returns The evaluated config object (raw, may have default export)
 */
export async function evaluateConfig(bundledCode: string): Promise<unknown> {
  const url = `data:text/javascript;base64,${Buffer.from(bundledCode).toString('base64')}`
  const mod = await import(/* @vite-ignore */ url)
  return mod.default ?? mod
}
