// Reference tasty options: caller options, plus the reference libraries and the `P` projection.
// The `P` projection reads `SystemProperties`. Both the Node bridge and the browser runtime build their
// tasty API through these getters. The display-result read and the budget warning are typed by the vendored
// tasty declarations, so this file declares no view types of its own.

import {
  createTastyApi,
  type CreateTastyApiOptions,
  type CreateTastyBrowserRuntimeOptions,
  type RawTastyDiagnostic,
  type TastyApi,
  type TastyDisplayResult,
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
const projectReferenceUiTypeParameterMembers: TastyTypeParameterMemberProjector = async ({
  api,
  reference,
  displayMembersOf = symbol => symbol.getDisplayMembers(),
}) => {
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

/** The display projection of `symbol` with its own walk limits; `truncated` says whether a limit dropped members from it. */
export function readReferenceDisplayResult(
  api: TastyApi,
  symbol: TastySymbol
): Promise<TastyDisplayResult> {
  return api.graph.getDisplayResult(symbol)
}

/** The TST-W-PROJECTION-BUDGET warning for one walk-limit notice; the tasty runtime mints the code and the wording. */
export function projectionBudgetWarning(notice: string): RawTastyDiagnostic {
  return tastyBrowser.projectionBudgetWarning(notice)
}
