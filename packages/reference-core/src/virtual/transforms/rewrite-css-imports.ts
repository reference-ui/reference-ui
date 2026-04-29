import { rewriteCssImports as rewriteCssImportsNative } from '@reference-ui/rust'

const LEGACY_CSS_IMPORT = /import\s*\{\s*css\s*\}\s*from\s*['"]src\/system\/runtime['"];?/
const PANDA_CSS_IMPORT = "import { css } from 'src/system/css';"

export function rewriteCssImports(sourceCode: string, relativePath: string): string {
	const rewritten = rewriteCssImportsNative(sourceCode, relativePath)

	return rewritten.replace(LEGACY_CSS_IMPORT, PANDA_CSS_IMPORT)
}
