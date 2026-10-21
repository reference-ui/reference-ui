// Reference tasty options: caller options, plus the reference libraries and the `P` projection.
// The `P` projection reads `SystemProperties`. Both the Node bridge and the browser runtime build their
// tasty API through these getters. The display-result read and the budget warning go through the typed
// views at the end of this file.

import {
  createTastyApi,
  type CreateTastyApiOptions,
  type CreateTastyBrowserRuntimeOptions,
  type RawTastyDiagnostic,
  type TastyApi,
  type TastyGraphApi,
  type TastyMember,
  type TastySymbol,
  type TastyTypeParameterMemberProjector,
} from '@reference-ui/rust/tasty'
import * as tastyBrowser from '@reference-ui/rust/tasty/browser'

const REFERENCE_UI_PREFERRED_EXTERNAL_LIBRARIES = [
  '@reference-ui/react',
  '@reference-ui/system',
  '@reference-ui/types',
]

const REFERENCE_UI_SYSTEM_PROPERTIES_LIBRARIES = [
  '@reference-ui/styled',
  '@reference-ui/react',
  '@reference-ui/system',
  '@reference-ui/types',
]

// The walk hands `displayMembersOf` in, so this read carries the path and budget of the walk that reached `P`: a cycle
// that passes back through `P` ends at the symbol it revisits. A direct call without it reads the public entry.
// The vendored declarations under src/native/generated predate that field, so it is typed here until they are refreshed.
type TypeParameterProjectorInput = Parameters<TastyTypeParameterMemberProjector>[0] & {
  displayMembersOf?: (symbol: TastySymbol) => Promise<TastyMember[]>
}

const projectReferenceUiTypeParameterMembers: TastyTypeParameterMemberProjector = async ({
  api,
  reference,
  displayMembersOf = symbol => symbol.getDisplayMembers(),
}: TypeParameterProjectorInput) => {
  if (reference.name !== 'P') return undefined

  for (const library of REFERENCE_UI_SYSTEM_PROPERTIES_LIBRARIES) {
    try {
      const projectedSymbol = await api.findSymbolByScopedName(library, 'SystemProperties')
      if (projectedSymbol) {
        return displayMembersOf(projectedSymbol)
      }
    } catch {
      // Keep trying narrower library scopes before falling back to a bare lookup.
    }
  }

  try {
    const projectedSymbol = await api.loadSymbolByName('SystemProperties')
    return displayMembersOf(projectedSymbol)
  } catch {
    return undefined
  }
}

export function getReferenceUiTastyApiOptions(): Pick<
  CreateTastyApiOptions,
  'preferredExternalLibraries' | 'projectTypeParameterMembers'
> {
  return {
    preferredExternalLibraries: REFERENCE_UI_PREFERRED_EXTERNAL_LIBRARIES,
    projectTypeParameterMembers: projectReferenceUiTypeParameterMembers,
  }
}

export function getReferenceUiTastyBrowserApiOptions(): NonNullable<
  CreateTastyBrowserRuntimeOptions['apiOptions']
> {
  return getReferenceUiTastyApiOptions()
}

export function createReferenceUiTastyApi(options: CreateTastyApiOptions): TastyApi {
  return createTastyApi({
    ...options,
    ...getReferenceUiTastyApiOptions(),
  })
}

// The vendored declarations under src/native/generated predate the display result and the budget warning builder,
// and tools/vendor-rust-tasty-dts.mjs cannot walk the current dist (it resolves extensionless specifiers only). Until
// the shelf is refreshed, these views type the two additions; the runtime behind them is the tasty runtime itself.

/** A display projection with the per-call `truncated` flag the tasty runtime reports for its own budget. */
export interface ReferenceDisplayResult {
  members: TastyMember[]
  truncated: boolean
}

interface ReferenceGraphWithDisplayResult {
  getDisplayResult(symbol: TastySymbol): Promise<ReferenceDisplayResult>
}

/** The display projection of `symbol` under its own budget; `truncated` says whether that budget cut the walk short. */
export function readReferenceDisplayResult(
  api: TastyApi,
  symbol: TastySymbol
): Promise<ReferenceDisplayResult> {
  return (api.graph as TastyGraphApi & ReferenceGraphWithDisplayResult).getDisplayResult(symbol)
}

interface TastyBrowserWithBudgetWarning {
  projectionBudgetWarning(symbolName: string): RawTastyDiagnostic
}

/** The TST-W-PROJECTION-BUDGET warning for a projection cut short; the tasty runtime mints the code and the message. */
export function projectionBudgetWarning(symbolName: string): RawTastyDiagnostic {
  return (tastyBrowser as typeof tastyBrowser & TastyBrowserWithBudgetWarning).projectionBudgetWarning(
    symbolName
  )
}