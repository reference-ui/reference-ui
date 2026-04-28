// Folders in the workspace that contain packages.
export const WORKSPACE_PACKAGE_ROOTS = ['packages', 'fixtures', 'matrix'] as const

// Managed local registry coordinates shared across registry and matrix flows.
export const MANAGED_REGISTRY_HOST = '127.0.0.1' as const
export const MANAGED_REGISTRY_PORT = 4873 as const
export const MANAGED_REGISTRY_SERVICE_HOST = 'registry' as const
export const DEFAULT_REGISTRY_URL = `http://${MANAGED_REGISTRY_HOST}:${MANAGED_REGISTRY_PORT}`
export const REGISTRY_URL_IN_CONTAINER = `http://${MANAGED_REGISTRY_SERVICE_HOST}:${MANAGED_REGISTRY_PORT}`

// Synthetic downstream consumers are materialized under one shared workdir.
export const CONSUMER_DIR_IN_CONTAINER = '/consumer' as const

// Matrix runs should always re-execute container commands. The useful reuse is
// already covered by the pnpm store and warmed node_modules caches.
export const DISABLE_DAGGER_CACHE = true as const

export const MATRIX_CONFIG = {
	concurrency: 6,
	containerRuntime: {
		cpu: 12,
		memoryGiB: 24,
	},
	quietPreparationSkips: true,
} as const

// Workspace packages that should be built and loaded into the local registry.
export const REGISTRY_PACKAGE_NAMES = [
	'@reference-ui/icons',
	'@reference-ui/rust',
	'@reference-ui/core',
	'@reference-ui/lib',
	'@fixtures/extend-library',
	'@fixtures/layer-library',
] as const

// Workspace packages that are actually published as part of a release.
export const RELEASE_PACKAGE_NAMES = [
	'@reference-ui/icons',
	'@reference-ui/rust',
	'@reference-ui/core',
	'@reference-ui/lib',
] as const
