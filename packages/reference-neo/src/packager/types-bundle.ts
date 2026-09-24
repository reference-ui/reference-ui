// Declaration leg of the Neo generated folder.
// It takes the output dir plus the evaluated spec and emits the central
// styled declarations plus the classic subpath modules. The react entry
// types arrive complete from the bound bake, already wired onto this
// graph, so this leg never rewrites them. Styled stays data-only (D4).

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { BASE_SYSTEM_HEADER } from './constants.ts'

/**
 * Publish the styled subpath declarations beside the central index: the root
 * entry, the tokens module, and the three classic types modules. Every file
 * re-exports or derives from the central typegen index, so the subpaths track
 * the evaluated spec with no second source of truth. Runs inside the
 * declaration leg; styled stays data-only (D4).
 */
function writeStyledSubpathDecls(outDir: string): void {
  const styledDir = join(outDir, 'styled')
  const typesDir = join(styledDir, 'types')
  const root = `${BASE_SYSTEM_HEADER}\nexport type * from './types/index.js'\n`
  const files: Array<[string, string]> = [
    [join(styledDir, 'index.d.ts'), root],
    [join(styledDir, 'tokens.d.ts'), root],
    [
      join(typesDir, 'conditions.d.ts'),
      `${BASE_SYSTEM_HEADER}\nimport type { StyleConditionKey } from './index.js'\n/** Condition table: every generated condition key maps to its selector. */\nexport type Conditions = { [K in StyleConditionKey]: string }\n`,
    ],
    [
      join(typesDir, 'prop-type.d.ts'),
      `${BASE_SYSTEM_HEADER}\nimport type { StyleProps } from './index.js'\n/** Utility table: every generated style prop maps to its value domain. */\nexport type UtilityValues = { [K in keyof StyleProps]: StyleProps[K] }\n`,
    ],
    [
      join(typesDir, 'style-props.d.ts'),
      `${BASE_SYSTEM_HEADER}\nimport type { StyleProps } from './index.js'\n/** System style props under the classic module name. */\nexport type SystemProperties = StyleProps\n`,
    ],
  ]
  for (const [file, text] of files) writeFileSync(file, text, 'utf-8')
}

/**
 * Publish the styled type declarations typegen prints from the evaluated
 * spec into styled/types, plus the classic subpaths. Runs after the react
 * bundle; styled stays data-only (D4).
 */
export async function publishTypesBundle(outDir: string, spec: EvaluatedSystemSpec): Promise<void> {
  const typegen = (await import('@reference-ui/rust/typegen')) as unknown as {
    emitDtsSync(options: { baseSystem: unknown }): string
  }
  const typesDir = join(outDir, 'styled', 'types')
  mkdirSync(typesDir, { recursive: true })
  writeFileSync(
    join(typesDir, 'index.d.ts'),
    `${BASE_SYSTEM_HEADER}\n${typegen.emitDtsSync({ baseSystem: spec })}`,
    'utf-8'
  )
  writeStyledSubpathDecls(outDir)
}
