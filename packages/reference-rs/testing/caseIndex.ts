/**
 * Case-folder convention for reference-rs station folders.
 * Every case folder is named by its raw ID and holds case.json, the index metadata
 * Memex reads: {"id": "<ID>", "name": "<claim>"}. Its README.md opens with the heading
 * "# <ID> — <claim>", and that claim is the same text as the name. This module reads those
 * files and returns convention violations as plain messages, so the station runner can
 * fail with the folder name and the fix, and the rules can be tested without a station.
 */
import fs from 'node:fs'
import path from 'node:path'

export const CASE_INDEX_FILE = 'case.json'
export const CASE_README_FILE = 'README.md'

/** What is on disk for a folder's case.json, before any rule is applied. */
export type CaseIndexRead =
  | { kind: 'missing' }
  | { kind: 'invalid'; error: string }
  | { kind: 'parsed'; value: unknown }

/** Reads case.json from one case folder without judging its contents. */
export function readCaseIndex(caseDir: string): CaseIndexRead {
  const file = path.join(caseDir, CASE_INDEX_FILE)
  if (!fs.existsSync(file)) return { kind: 'missing' }
  try {
    return { kind: 'parsed', value: JSON.parse(fs.readFileSync(file, 'utf8')) }
  } catch (error) {
    return {
      kind: 'invalid',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/** Reads README.md from one case folder, or null when the file is absent. */
export function readCaseReadme(caseDir: string): string | null {
  const file = path.join(caseDir, CASE_README_FILE)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Convention violations for one case folder; an empty list means it conforms.
 * The spec.ts id is checked separately by the runner when it loads the spec.
 */
export function caseIndexProblems(folderName: string, read: CaseIndexRead): string[] {
  if (read.kind === 'missing') {
    return [
      `no ${CASE_INDEX_FILE}; add {"id": "${folderName}", "name": "<one-line claim>"}`,
    ]
  }
  if (read.kind === 'invalid') {
    return [`${CASE_INDEX_FILE} is not valid JSON (${read.error})`]
  }
  if (!isRecord(read.value)) {
    return [`${CASE_INDEX_FILE} must be a JSON object`]
  }
  const problems: string[] = []
  const id = read.value.id
  if (id !== folderName) {
    const got = id === undefined ? 'is missing' : `is ${JSON.stringify(id)}`
    problems.push(
      `${CASE_INDEX_FILE} id ${got}; it must equal folder name "${folderName}"`
    )
  }
  const name = read.value.name
  if (typeof name !== 'string' || name.trim() === '') {
    problems.push(`${CASE_INDEX_FILE} needs a non-empty string "name"`)
  }
  return problems
}

/** Folder names under a cases/ directory that are not raw case IDs, each one a violation. */
export function strayCaseFolders(
  names: readonly string[],
  folderPattern: RegExp
): string[] {
  return names.filter(name => !folderPattern.test(name))
}

const README_HEADING = /^# (.+?) — (.*)$/

/** The case.json name when it is a string on a JSON object, else undefined. */
export function caseIndexName(read: CaseIndexRead): string | undefined {
  if (read.kind !== 'parsed' || !isRecord(read.value)) return undefined
  return typeof read.value.name === 'string' ? read.value.name : undefined
}

/**
 * Convention violations for one case README; an empty list means it conforms.
 * The first line must be "# <folder> — <claim>": this folder's own ID, then a claim.
 * When case.json's name is known, the claim must equal it.
 */
export function readmeProblems(folderName: string, readme: string | null, name?: string): string[] {
  const expected = `"# ${folderName} — <one-line claim>"`
  if (readme === null) {
    return [`no ${CASE_README_FILE}; its first line must be ${expected}`]
  }
  const firstLine = readme.split(/\r?\n/, 1)[0] ?? ''
  const heading = README_HEADING.exec(firstLine)
  if (!heading) {
    return [`${CASE_README_FILE} first line must be ${expected}`]
  }
  const problems: string[] = []
  if (heading[1] !== folderName) {
    problems.push(
      `${CASE_README_FILE} heading names "${heading[1]}"; it must name folder "${folderName}"`
    )
  }
  const claim = heading[2]!
  if (claim.trim() === '') {
    problems.push(`${CASE_README_FILE} heading has no claim after the em dash`)
  } else if (name !== undefined && claim !== name) {
    problems.push(
      `${CASE_README_FILE} heading claim "${claim}" must equal case.json name "${name}"`
    )
  }
  return problems
}
