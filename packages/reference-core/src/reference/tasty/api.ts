// Reference tasty options: caller options, plus the reference libraries and the `P` projection.
// The `P` projection reads `SystemProperties`. Both the Node bridge and the browser runtime build their
// tasty API through these getters.

import {
  createTastyApi,
  type CreateTastyApiOptions,
  type CreateTastyBrowserRuntimeOptions,
  type TastyApi,
  type TastyMember,
  type TastySymbol,
  type TastyTypeParameterMemberProjector,
} from '@reference-ui/rust/tasty'

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