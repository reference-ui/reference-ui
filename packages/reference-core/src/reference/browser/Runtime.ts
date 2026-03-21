import * as React from 'react'
import type { TastyApi, TastyBrowserRuntime } from '@reference-ui/rust/tasty'
import type { LoadedReferenceState, ReferenceStatus } from './types'

export interface ReferenceRuntime {
  loadReferenceState(name: string): Promise<LoadedReferenceState>
}

function getReferenceApi(runtime: TastyBrowserRuntime): Promise<TastyApi> {
  return runtime.loadApi()
}

function formatModifiers(isReadonly: boolean, isOptional: boolean): string {
  const modifiers = [isReadonly ? 'readonly' : null, isOptional ? 'optional' : null].filter(
    Boolean,
  )

  return modifiers.length > 0 ? modifiers.join(', ') : '-'
}

export function createReferenceRuntime(runtime: TastyBrowserRuntime): ReferenceRuntime {
  async function loadReferenceState(name: string): Promise<LoadedReferenceState> {
    const api = await getReferenceApi(runtime)
    const symbol = await api.loadSymbolByName(name)
    const kind = symbol.getKind() === 'typeAlias' ? 'typeAlias' : 'interface'
    const members =
      kind === 'interface'
        ? await api.graph.flattenInterfaceMembers(symbol)
        : []

    return {
      name: symbol.getName(),
      kind,
      typeParameters: symbol.getTypeParameters().map(param => param.name),
      extendsNames: symbol.getExtends().map(ref => ref.getName()),
      definition: symbol.getUnderlyingType()?.describe() ?? null,
      members: members.map(member => ({
        name: member.getName(),
        type: member.getType()?.describe() ?? 'unknown',
        modifiers: formatModifiers(member.isReadonly(), member.isOptional()),
      })),
    }
  }

  return {
    loadReferenceState,
  }
}

export function useReferenceStatus(runtime: ReferenceRuntime, name: string): ReferenceStatus {
  const [status, setStatus] = React.useState<ReferenceStatus>({ state: 'loading' })

  React.useEffect(() => {
    let active = true
    setStatus({ state: 'loading' })

    void runtime
      .loadReferenceState(name)
      .then(data => {
        if (!active) return
        setStatus({ state: 'ready', data })
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = error instanceof Error ? error.message : String(error)
        setStatus({ state: 'error', message })
      })

    return () => {
      active = false
    }
  }, [name, runtime])

  return status
}
