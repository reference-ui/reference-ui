import { rewriteCvaImports as rewriteCvaImportsNative } from '@reference-ui/rust'

const LEGACY_CVA_IMPORT = /import\s*\{\s*cva\s*\}\s*from\s*['"]src\/system\/runtime['"];?/
const PANDA_CVA_IMPORT = "import { cva } from 'src/system/css';"

/**
 * Retarget canonical `cva` imports to the Panda-visible generated system path.
 */
export function rewriteCvaImports(sourceCode: string, relativePath: string): string {
	const rewritten = rewriteCvaImportsNative(sourceCode, relativePath)

	return rewritten.replace(LEGACY_CVA_IMPORT, PANDA_CVA_IMPORT)
}
