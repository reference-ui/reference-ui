// Folders in the workspace that contain packages.
export const workspacePackageRoots = ['packages', 'fixtures'] as const

// Workspace packages that should be built and loaded into the local registry.
export const registryPackageNames = [
	'@reference-ui/icons',
	'@reference-ui/rust',
	'@reference-ui/core',
	'@reference-ui/lib',
	'@fixtures/extend-library',
	'@fixtures/layer-library',
] as const
