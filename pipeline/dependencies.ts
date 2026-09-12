/**
 * Managed toolchain and generated dependency versions.
 *
 * Generators and the matrix runner must read these instead of local literals.
 * Bump a pin here, then run matrix setup so generated package.json files follow.
 */

// Node image for Vitest-only matrix jobs and Rust Dagger builds.
export const MANAGED_NODE_IMAGE = 'node:24-bookworm'

// pnpm installed into matrix and Rust containers via corepack.
export const MANAGED_PNPM_VERSION = '10.29.3'

// Exact @playwright/test pin. Must match the Microsoft Playwright Docker tag.
export const MANAGED_PLAYWRIGHT_VERSION = '1.62.1'

// Distro suffix for mcr.microsoft.com/playwright:v<version>-<distro>.
// Jammy (Ubuntu 22.04) is Node 24 from Playwright 1.57 onward.
export const MANAGED_PLAYWRIGHT_IMAGE_DISTRO = 'jammy'

export function managedPlaywrightContainerImage(
	version: string = MANAGED_PLAYWRIGHT_VERSION,
): string {
	return `mcr.microsoft.com/playwright:v${version}-${MANAGED_PLAYWRIGHT_IMAGE_DISTRO}`
}

// Shared matrix fixture toolchain. Written into every generated matrix package.json.
export const MANAGED_MATRIX_DEV_DEPENDENCIES = {
	'@types/node': '^25.1.0',
	'happy-dom': '^18.0.1',
	postcss: '^8.5.8',
	typescript: '~7.0.2',
	vitest: '^4.1.0',
} as const

// Vite 7 surface for default-mode matrix fixtures and consumers.
export const MANAGED_VITE7_DEV_DEPENDENCIES = {
	'@vitejs/plugin-react': '^4.7.0',
	vite: '^7.3.5',
} as const

// Webpack 5 surface for full-mode / webpack matrix consumers.
export const MANAGED_WEBPACK5_DEV_DEPENDENCIES = {
	'css-loader': '^7.1.2',
	'html-webpack-plugin': '^5.6.3',
	'style-loader': '^4.0.0',
	'ts-loader': '^9.5.2',
	webpack: '^5.98.0',
	'webpack-cli': '^6.0.1',
	'webpack-dev-server': '^5.2.6',
} as const

// Runtime React versions selected by matrix.json `react`.
export const MANAGED_REACT_DEPENDENCIES = {
	react17: {
		react: '^17.0.2',
		'react-dom': '^17.0.2',
	},
	react18: {
		react: '^18.3.1',
		'react-dom': '^18.3.1',
	},
	react19: {
		react: '^19.2.0',
		'react-dom': '^19.2.0',
	},
} as const

// Matching @types for each React runtime above.
export const MANAGED_REACT_DEV_DEPENDENCIES = {
	react17: {
		'@types/react': '^17.0.83',
		'@types/react-dom': '^17.0.26',
	},
	react18: {
		'@types/react': '^18.3.18',
		'@types/react-dom': '^18.3.5',
	},
	react19: {
		'@types/react': '^19.2.2',
		'@types/react-dom': '^19.2.2',
	},
} as const
