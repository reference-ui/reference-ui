/**
 * Child-side driver for TST-BOUND-01, called by runIsolated in its own Node process.
 * Opens the emitted manifest at the given path and calls getDisplayMembers() on every symbol, so a projection
 * that never returns or exhausts the heap ends the child, not the Vitest worker. It imports only the built dist.
 * It resolves to one record per symbol (id, name, member names) plus the runtime notices the API collected.
 */
import { createTastyApi } from '../../../../../dist/tasty.mjs'

export async function displayEverySymbol(manifestPath) {
  const api = createTastyApi({ manifestPath })
  await api.ready()
  const manifest = await api.loadManifest()
  const symbols = []
  for (const id of Object.keys(manifest.symbolsById).sort()) {
    const symbol = await api.loadSymbolById(id)
    const members = await symbol.getDisplayMembers()
    symbols.push({ id, name: symbol.getName(), members: members.map(member => member.getName()) })
  }
  return { symbols, notices: api.getRuntimeNotices() }
}
