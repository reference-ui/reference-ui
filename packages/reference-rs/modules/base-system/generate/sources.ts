/**
 * Lib theme files this generator is allowed to read.
 * Six `tokens()` call sites, six `keyframes()` tables, plus the `font()` family
 * table. Paths are relative to the repository root so the tool stays a build-time
 * reader — the Rust crate never opens these files. If a new `tokens()` or
 * `keyframes()` site appears, this list must grow or `--check` will miss it.
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const generateDir = path.dirname(fileURLToPath(import.meta.url));

/** `packages/reference-rs/modules/base-system`. */
export const moduleDir = path.resolve(generateDir, '..');

/** Repository root (`reference-ui`). */
export const repoRoot = path.resolve(moduleDir, '../../../..');

/** Committed nested dump `from_json` consumes via `include_str!`. */
export const dumpPath = path.join(moduleDir, 'src/lib_fixture/lib.json');

export const TOKEN_FILES = [
  'packages/reference-lib/src/core/theme/colors.ts',
  'packages/reference-lib/src/core/theme/design.ts',
  'packages/reference-lib/src/core/theme/primitives/tokens.ts',
  'packages/reference-lib/src/core/theme/radii.ts',
  'packages/reference-lib/src/core/theme/animations/tokens.ts',
  'packages/reference-lib/src/components/Reference/theme/tokens.ts',
] as const;

export const FONT_FILE = 'packages/reference-lib/src/core/theme/fonts.ts';

export const KEYFRAME_FILES = [
  'packages/reference-lib/src/core/theme/animations/fade.ts',
  'packages/reference-lib/src/core/theme/animations/spin.ts',
  'packages/reference-lib/src/core/theme/animations/slide.ts',
  'packages/reference-lib/src/core/theme/animations/scale.ts',
  'packages/reference-lib/src/core/theme/animations/bounce.ts',
  'packages/reference-lib/src/core/theme/animations/attention.ts',
] as const;

export function libPath(rel: string): string {
  return path.join(repoRoot, rel);
}
