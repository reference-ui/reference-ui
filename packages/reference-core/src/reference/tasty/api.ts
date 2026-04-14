import {
  createTastyApi,
  type CreateTastyApiOptions,
  type CreateTastyBrowserRuntimeOptions,
  type TastyApi,
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

const projectReferenceUiTypeParameterMembers: TastyTypeParameterMemberProjector = async ({
  api,
  reference,
}) => {
  if (reference.name !== 'P') return undefined

  for (const library of REFERENCE_UI_SYSTEM_PROPERTIES_LIBRARIES) {
    try {
      const projectedSymbol = await api.findSymbolByScopedName(library, 'SystemProperties')
      if (projectedSymbol) {
        return projectedSymbol.getDisplayMembers()
      }
    } catch {
      // Keep trying narrower library scopes before falling back to a bare lookup.
    }
  }

  try {
    const projectedSymbol = await api.loadSymbolByName('SystemProperties')
    return projectedSymbol.getDisplayMembers()
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