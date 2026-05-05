/** Shared constants for Reference UI output layout and tooling. */

/**
 * Unscoped names of generated packages (`@reference-ui/<name>`). Each matches the
 * folder under the sync out dir and the entry under `node_modules/@reference-ui/`
 * (see packager `installPackages`).
 */
export const GENERATED_PACKAGE_NAMES = [
  'react',
  'system',
  'styled',
  'types',
] as const

/**
 * Generated output directories under `.reference-ui/` whose raw file writes
 * should not trigger immediate bundler refresh handling.
 *
 * Includes {@link GENERATED_PACKAGE_NAMES} plus non-package roots written under
 * the same out dir (e.g. `mcp`, `virtual`).
 */
export const GENERATED_OUTPUT_ROOTS = [
  ...GENERATED_PACKAGE_NAMES,
  'mcp',
  'virtual',
] as const

export const DEFAULT_OUT_DIR = '.reference-ui'

/**
 * Explicit React DTS roots that we seed into the synthetic tsconfig.
 *
 * These keep packaged consumer declaration output stable when type-only imports
 * are not discovered transitively by `tsgo`.
 */
export const REACT_DTS_INCLUDE = [
  'src/system/primitives/index.tsx',
  'src/system/primitives/types.ts',
  'src/system/runtime/index.ts',
  'src/types/index.ts',
  'src/types/BaseSystem.ts',
  'src/types/colors.ts',
  'src/types/conditions.ts',
  'src/types/css.ts',
  'src/types/fontRegistry.ts',
  'src/types/fonts.ts',
  'src/types/primitives.ts',
  'src/types/props.ts',
  'src/types/radii.ts',
  'src/types/recipe.ts',
  'src/types/style-prop.ts',
  'src/types/style-props.ts',
  'src/types/system-style-object.ts',
] as const

/**
 * Explicit system DTS roots that we seed into the synthetic tsconfig.
 *
 * The system package re-exports the authored style types via its entry, and the
 * strict-token rewrite owns files under `types/`. Keeping this list explicit
 * avoids depending on whatever transitive declaration graph `tsgo` happens to
 * preserve for type-only star re-exports.
 */
export const SYSTEM_DTS_INCLUDE = [
  'src/types/index.ts',
  'src/types/BaseSystem.ts',
  'src/types/colors.ts',
  'src/types/conditions.ts',
  'src/types/css.ts',
  'src/types/fontRegistry.ts',
  'src/types/fonts.ts',
  'src/types/primitives.ts',
  'src/types/props.ts',
  'src/types/radii.ts',
  'src/types/recipe.ts',
  'src/types/style-prop.ts',
  'src/types/style-props.ts',
  'src/types/system-style-object.ts',
] as const

/**
 * Picomatch-style glob for the sync output directory under any ancestor (watchers,
 * virtual copy, Panda fragment scan excludes).
 */
export const SYNC_OUTPUT_DIR_GLOB = `**/${DEFAULT_OUT_DIR}/**`
