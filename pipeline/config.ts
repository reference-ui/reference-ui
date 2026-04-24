// Folders in the workspace that contain packages.
export const workspacePackageRoots = ['packages', 'fixtures', 'matrix'] as const

// Managed local registry coordinates shared across registry and matrix flows.
export const managedRegistryHost = '127.0.0.1' as const
export const managedRegistryPort = 4873 as const
export const managedRegistryServiceHost = 'registry' as const
export const defaultRegistryUrl = `http://${managedRegistryHost}:${managedRegistryPort}`
export const registryUrlInContainer = `http://${managedRegistryServiceHost}:${managedRegistryPort}`

// Synthetic downstream consumers are materialized under one shared workdir.
export const consumerDirInContainer = '/consumer' as const

// Workspace packages that should be built and loaded into the local registry.
export const registryPackageNames = [
	'@reference-ui/icons',
	'@reference-ui/rust',
	'@reference-ui/core',
	'@reference-ui/lib',
	'@fixtures/extend-library',
	'@fixtures/layer-library',
] as const

// Workspace packages that are actually published as part of a release.
export const releasePackageNames = [
	'@reference-ui/icons',
	'@reference-ui/rust',
	'@reference-ui/core',
	'@reference-ui/lib',
] as const
