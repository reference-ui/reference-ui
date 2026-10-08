/**
 * Entry point for the primitives generator (`pnpm run primitives`).
 * Collects the canon HTML roster plus the live typegen vocabulary, prints E1
 * (vocabulary.json), E2 (primitives.mjs), and E4 (primitives.d.ts), scans
 * tripwires, and writes all three files. Deterministic: identical sources always
 * yield byte-identical output. Exits nonzero on any fail-closed violation with
 * the offending source named.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { joinElements, loadElementSources } from './elements.js'
import {
  buildPrimitivesDts,
  buildPrimitivesMjs,
  buildVocabularyJson,
  scanTripwires,
  type VocabularyModel,
} from './emit.js'
import { loadVocabulary } from './vocabulary.js'

const here = dirname(fileURLToPath(import.meta.url))
const GENERATED_DIR = resolve(here, '../generated')
const VOCABULARY_PATH = resolve(GENERATED_DIR, 'vocabulary.json')
const PRIMITIVES_MJS_PATH = resolve(GENERATED_DIR, 'primitives.mjs')
const PRIMITIVES_DTS_PATH = resolve(GENERATED_DIR, 'primitives.d.ts')

export interface PrimitiveArtifacts {
  vocabularyJson: string
  primitivesMjs: string
  primitivesDts: string
}

export function buildArtifacts(): PrimitiveArtifacts {
  const model: VocabularyModel = {
    elements: joinElements(loadElementSources()),
    vocab: loadVocabulary(),
  }
  const artifacts: PrimitiveArtifacts = {
    vocabularyJson: buildVocabularyJson(model),
    primitivesMjs: buildPrimitivesMjs(model),
    primitivesDts: buildPrimitivesDts(model),
  }
  scanTripwires([
    { name: 'vocabulary.json', text: artifacts.vocabularyJson },
    { name: 'primitives.mjs', text: artifacts.primitivesMjs },
    { name: 'primitives.d.ts', text: artifacts.primitivesDts },
  ])
  return artifacts
}

export function main(): void {
  const artifacts = buildArtifacts()
  mkdirSync(GENERATED_DIR, { recursive: true })
  writeFileSync(VOCABULARY_PATH, artifacts.vocabularyJson, 'utf8')
  writeFileSync(PRIMITIVES_MJS_PATH, artifacts.primitivesMjs, 'utf8')
  writeFileSync(PRIMITIVES_DTS_PATH, artifacts.primitivesDts, 'utf8')
  const elements = JSON.parse(artifacts.vocabularyJson) as { elements: unknown[] }
  console.log(
    `[primitives] wrote vocabulary.json (${elements.elements.length} elements) + primitives.mjs + primitives.d.ts`
  )
}

const invokedDirectly = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)

if (invokedDirectly) main()
