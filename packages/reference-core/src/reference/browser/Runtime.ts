import type { TastyApi, TastyBrowserRuntime, TastyMember, TastySymbol } from '@reference-ui/rust/tasty'

export interface ReferenceRuntime {
  load(name: string): Promise<ReferenceRuntimeData>
}

export interface ReferenceRuntimeData {
  symbol: TastySymbol
  members: TastyMember[]
}

function getReferenceApi(runtime: TastyBrowserRuntime): Promise<TastyApi> {
  return runtime.loadApi()
}

async function loadReferenceRuntimeData(
  runtime: TastyBrowserRuntime,
  name: string,
): Promise<ReferenceRuntimeData> {
  const api = await getReferenceApi(runtime)
  const symbol = await api.loadSymbolByName(name)
  const members = symbol.getKind() === 'interface' ? await api.graph.getEffectiveMembers(symbol) : []

  return {
    symbol,
    members,
  }
}

export function createReferenceRuntime(runtime: TastyBrowserRuntime): ReferenceRuntime {
  async function load(name: string): Promise<ReferenceRuntimeData> {
    return loadReferenceRuntimeData(runtime, name)
  }

  return {
    load,
  }
}
