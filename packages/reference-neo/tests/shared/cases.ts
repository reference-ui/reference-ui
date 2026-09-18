// cases.ts — case discovery for the neo harness. Takes nothing (reads case
// folders under tests/cases/, grouped at any depth). Emits case records
// { id, name, folder, dir, worldDir, specsDir, description } via
// listCases/getCase, plus substring search over id, name, and README
// text via searchCases.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// A folder with a case.json is a case and a leaf; anything else is a group
// we descend into. Folders come out as posix-style relative paths.
function collectCaseFolders(dir: string, prefix: string, out: string[]): void {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (fs.existsSync(path.join(dir, e.name, 'case.json'))) out.push(rel);
    else collectCaseFolders(path.join(dir, e.name), rel, out);
  }
}

// All cases sorted by id. A missing or long README is never a failure:
// description is '' when the file is absent. Duplicate ids across groups
// fail loud, since getCase and the last-run log key on id.
export function listCases(): NeoCase[] {
  if (!fs.existsSync(CASES_DIR)) return [];
  const folders: string[] = [];
  collectCaseFolders(CASES_DIR, '', folders);
  const cases = folders.map(loadCase).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const seen = new Map<string, string>();
  for (const c of cases) {
    const prev = seen.get(c.id);
    if (prev !== undefined) throw new Error(`duplicate case id ${c.id} in ${prev} and ${c.folder}`);
    seen.set(c.id, c.folder);
  }
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

// Exact id or folder wins; otherwise the selector is an id prefix
// (`agentneo run NEO-COND` runs the group). Unknown stays an error.
export function matchCases(selector: string): NeoCase[] {
  const all = listCases();
  const exact = all.find((c) => c.id === selector || c.folder === selector);
  if (exact) return [exact];
  const prefixed = all.filter((c) => c.id.startsWith(selector));
  if (prefixed.length > 0) return prefixed;
  return [getCase(selector)];
}
