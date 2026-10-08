// ESM loader hooks for the module-load census (voyage-one-shot wave 0).
// It takes a CENSUS_OUT file path via env and appends every loaded file: URL,
// one per line, so the runner can slice the config-import window and attribute
// loads by package. No product import; node builtins only.
import { appendFileSync } from 'node:fs'

export async function load(url, context, nextLoad) {
  const out = process.env.CENSUS_OUT
  if (out && url.startsWith('file:')) {
    try {
      appendFileSync(out, `${url}\n`)
    } catch {
      // A failed census write must never break the measured import.
    }
  }
  return nextLoad(url, context)
}
