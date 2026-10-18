// caseIndex.ts — the case-folder convention for the neo harness. A case folder is
// named by its raw ID (NEO-<GROUP>-<nn>, with an optional one-letter variant such as
// NEO-PLAY-B-01) and holds case.json {"id", "name"} plus a README.md whose first line
// is "# <ID> — <name>". Takes a case folder's path and emits convention problems as
// plain messages, so scanCases in cases.ts can report every broken folder before a case loads. Mirrors
// packages/reference-rs/testing/caseIndex.ts and adds the rule that name equals the claim.
import fs from 'node:fs';
import path from 'node:path';

const CASE_INDEX_FILE = 'case.json';
const CASE_README_FILE = 'README.md';

/** A raw case ID: NEO-<GROUP>-<nn>, with an optional one-letter variant segment. */
export const NEO_CASE_ID = /^NEO-[A-Z]+(?:-[A-Z])?-\d{2}$/;

// Any of these marks a folder as a case even when case.json is missing, so a
// broken case cannot hide inside a group and be skipped without a word.
const CASE_MARKERS = [CASE_INDEX_FILE, 'specs', 'world'];

const README_HEADING = /^# (.+?) — (.*)$/;

/** What is on disk for a folder's case.json, before any rule is applied. */
export type CaseIndexRead =
  | { kind: 'missing' }
  | { kind: 'invalid'; error: string }
  | { kind: 'parsed'; value: unknown };

/** A case folder is a case, or a broken one; any other folder is a group to descend into. */
export function isCaseFolder(caseDir: string, folderName: string): boolean {
  if (NEO_CASE_ID.test(folderName)) return true;
  return CASE_MARKERS.some((marker) => fs.existsSync(path.join(caseDir, marker)));
}

/** Reads case.json from one case folder without judging its contents. */
export function readCaseIndex(caseDir: string): CaseIndexRead {
  const file = path.join(caseDir, CASE_INDEX_FILE);
  if (!fs.existsSync(file)) return { kind: 'missing' };
  try {
    return { kind: 'parsed', value: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (error) {
    return { kind: 'invalid', error: error instanceof Error ? error.message : String(error) };
  }
}

/** Reads README.md from one case folder, or null when the file is absent. */
export function readCaseReadme(caseDir: string): string | null {
  const file = path.join(caseDir, CASE_README_FILE);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The case.json name when it is a string on a JSON object, else undefined. */
function caseName(read: CaseIndexRead): string | undefined {
  if (read.kind !== 'parsed' || !isRecord(read.value)) return undefined;
  return typeof read.value.name === 'string' ? read.value.name : undefined;
}

/**
 * Convention problems for one case.json; an empty list means it conforms.
 * The id must equal the folder name, and the name must be a non-empty string.
 */
export function caseIndexProblems(folderName: string, read: CaseIndexRead): string[] {
  if (read.kind === 'missing') {
    return [`no ${CASE_INDEX_FILE}; add {"id": "${folderName}", "name": "<one-line claim>"}`];
  }
  if (read.kind === 'invalid') {
    return [`${CASE_INDEX_FILE} is not valid JSON (${read.error})`];
  }
  if (!isRecord(read.value)) {
    return [`${CASE_INDEX_FILE} must be a JSON object`];
  }
  const problems: string[] = [];
  const id = read.value.id;
  if (id !== folderName) {
    const got = id === undefined ? 'is missing' : `is ${JSON.stringify(id)}`;
    problems.push(`${CASE_INDEX_FILE} id ${got}; it must equal folder name "${folderName}"`);
  }
  const name = read.value.name;
  if (typeof name !== 'string' || name.trim() === '') {
    problems.push(`${CASE_INDEX_FILE} needs a non-empty string "name"`);
  }
  return problems;
}

/** A case folder that breaks the convention, with every problem found in it. */
export interface BrokenCase {
  folder: string;
  problems: string[];
}

/** The one error for broken folders: names each folder and its fix (AGENTS.md section 7). */
export function conventionError(broken: BrokenCase[]): string {
  const lines = broken.flatMap((b) => b.problems.map((p) => `${b.folder}: ${p}`));
  return `case convention broken (AGENTS.md section 7); fix these case folders:\n  ${lines.join('\n  ')}`;
}

/** True when a run selector picks this folder: its path, its folder name, or a prefix of that name. */
export function selectsFolder(selector: string, folder: string): boolean {
  const name = path.basename(folder);
  return folder === selector || name === selector || name.startsWith(selector);
}

/** The one stderr line for a broken folder that a run does not select. */
export function skipWarning(broken: BrokenCase): string {
  return `warning: skipped broken case folder ${broken.folder}: ${broken.problems[0]} (agentneo list shows every problem)`;
}

/**
 * Convention problems for one README; an empty list means it conforms.
 * The first line must be "# <folder> — <name>": this folder's own ID, then the case.json name.
 * With no usable name (case.json is broken and reported on its own), only the ID and claim are checked.
 */
export function readmeProblems(folderName: string, readme: string | null, name: string | undefined): string[] {
  const expected = `"# ${folderName} — ${name ?? '<one-line claim>'}"`;
  if (readme === null) {
    return [`no ${CASE_README_FILE}; its first line must be ${expected}`];
  }
  const heading = README_HEADING.exec(readme.split(/\r?\n/, 1)[0]);
  if (!heading) {
    return [`${CASE_README_FILE} first line must be ${expected}`];
  }
  return headingProblems(folderName, heading[1], heading[2], name);
}

// The heading must name this folder, and its claim must be non-empty and equal
// the case.json name when that name is known.
function headingProblems(folderName: string, id: string, claim: string, name: string | undefined): string[] {
  const problems: string[] = [];
  if (id !== folderName) {
    problems.push(`${CASE_README_FILE} heading names "${id}"; it must name folder "${folderName}"`);
  }
  if (claim.trim() === '') {
    problems.push(`${CASE_README_FILE} heading has no claim after the em dash`);
  } else if (name !== undefined && claim !== name) {
    problems.push(`${CASE_README_FILE} heading claim "${claim}" must equal case.json name "${name}"`);
  }
  return problems;
}

/**
 * Every convention problem for one case folder: its name, case.json and README.md.
 * An empty list means the folder conforms.
 */
export function caseFolderProblems(folderName: string, caseDir: string): string[] {
  const read = readCaseIndex(caseDir);
  const nameProblems = NEO_CASE_ID.test(folderName)
    ? []
    : ['folder is not named by a raw case ID (NEO-<GROUP>-<nn>)'];
  return [
    ...nameProblems,
    ...caseIndexProblems(folderName, read),
    ...readmeProblems(folderName, readCaseReadme(caseDir), caseName(read)),
  ];
}
