// cases.ts — case discovery for the neo harness. Takes nothing (reads case
// folders under tests/cases/, grouped at any depth). Emits case records
// { id, name, folder, dir, worldDir, specsDir, description } via
// listCases/getCase, plus substring search over id, name, and README
// text via searchCases. scanCases splits the folders into conforming cases and
// broken ones (convention checked in caseIndex.ts). listCases, searchCases and
// getCase fail loud on any broken folder; matchCases fails only when the folders
// it selects are broken, so `run <ID>` can skip the rest with a warning.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { caseFolderProblems, conventionError, isCaseFolder, selectsFolder, type BrokenCase } from './caseIndex.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
export const TESTS_DIR: string = path.resolve(HERE, '..');
export const CASES_DIR: string = path.join(TESTS_DIR, 'cases');
export const ARTIFACTS_DIR: string = path.join(TESTS_DIR, '.artifacts');

export interface NeoCase {
  id: string;
  name: string;
  folder: string;
  dir: string;
  worldDir: string;
  specsDir: string;
  description: string;
}

interface CaseMeta {
  id?: unknown;
  name?: unknown;
}

function readFirstLine(file: string): string {
  try {
    const text = fs.readFileSync(file, 'utf8');
    const line = text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    return line ?? '';
  } catch {
    return '';
  }
}

function readText(file: string): string {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function loadCase(folder: string): NeoCase {
  const dir = path.join(CASES_DIR, folder);
  const raw = fs.readFileSync(path.join(dir, 'case.json'), 'utf8');
  const meta = JSON.parse(raw) as CaseMeta;
  if (typeof meta.id !== 'string' || typeof meta.name !== 'string') {
    throw new Error(`case.json in ${folder} must have id and name`);
  }
  return {
    id: meta.id,
    name: meta.name,
    folder,
    dir,
    worldDir: path.join(dir, 'world'),
    specsDir: path.join(dir, 'specs'),
    description: readFirstLine(path.join(dir, 'README.md')),
  };
}

// A case folder (isCaseFolder in caseIndex.ts) is a leaf, even when broken;
// any other folder is a group we descend into. Folders come out as
// posix-style relative paths.
function collectCaseFolders(dir: string, prefix: string, out: string[]): void {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (isCaseFolder(path.join(dir, e.name), e.name)) out.push(rel);
    else collectCaseFolders(path.join(dir, e.name), rel, out);
  }
}

// Every case folder, split into conforming cases (sorted by id) and broken
// ones. A broken folder keeps all of its problems, so each caller decides
// whether it fails the command. A duplicate id makes every folder carrying it
// broken, since getCase and the last-run log key on id.
export interface CaseScan {
  cases: NeoCase[];
  broken: BrokenCase[];
}

export function scanCases(): CaseScan {
  if (!fs.existsSync(CASES_DIR)) return { cases: [], broken: [] };
  const folders: string[] = [];
  collectCaseFolders(CASES_DIR, '', folders);
  const broken: BrokenCase[] = [];
  const conforming: string[] = [];
  for (const folder of folders) {
    const problems = caseFolderProblems(path.basename(folder), path.join(CASES_DIR, folder));
    if (problems.length > 0) broken.push({ folder, problems });
    else conforming.push(folder);
  }
  const unique = splitDuplicateIds(conforming.map(loadCase));
  const cases = unique.cases;
  broken.push(...unique.broken);
  cases.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  broken.sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0));
  return { cases, broken };
}

// Loaded cases whose id no other folder carries; every folder sharing an id goes to broken.
function splitDuplicateIds(loaded: NeoCase[]): { cases: NeoCase[]; broken: BrokenCase[] } {
  const foldersById = new Map<string, string[]>();
  for (const c of loaded) foldersById.set(c.id, [...(foldersById.get(c.id) ?? []), c.folder]);
  const cases: NeoCase[] = [];
  const broken: BrokenCase[] = [];
  for (const c of loaded) {
    const others = (foldersById.get(c.id) ?? []).filter((f) => f !== c.folder);
    if (others.length > 0) broken.push({ folder: c.folder, problems: [`duplicate case id ${c.id} also in ${others.join(', ')}`] });
    else cases.push(c);
  }
  return { cases, broken };
}

// Strict: list, search, status and run-all need every case folder to conform.
export function listCases(): NeoCase[] {
  const { cases, broken } = scanCases();
  if (broken.length > 0) throw new Error(conventionError(broken));
  return cases;
}

export function getCase(idOrFolder: string): NeoCase {
  const found = listCases().find((c) => c.id === idOrFolder || c.folder === idOrFolder);
  if (!found) throw new Error(`unknown case: ${idOrFolder}`);
  return found;
}

// Substring match over id, name, and full README text.
export function searchCases(query: string): NeoCase[] {
  const q = query.toLowerCase();
  if (!q) return listCases();
  return listCases().filter((c) => {
    const readme = readText(path.join(c.dir, 'README.md'));
    return c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || readme.toLowerCase().includes(q);
  });
}

// `run` selection. An exact id or folder wins, otherwise the selector is an id
// prefix (`agentneo run NEO-COND` runs the group). Only the folders it picks
// decide failure: a picked broken folder throws with its problems, and broken
// folders it does not pick are left for the caller to report.
export function matchCases(selector: string): NeoCase[] {
  const { cases, broken } = scanCases();
  const picked = broken.filter((b) => selectsFolder(selector, b.folder));
  if (picked.length > 0) throw new Error(conventionError(picked));
  const exact = cases.find((c) => c.id === selector || c.folder === selector);
  if (exact) return [exact];
  const prefixed = cases.filter((c) => c.id.startsWith(selector));
  if (prefixed.length > 0) return prefixed;
  throw new Error(`unknown case: ${selector}`);
}
