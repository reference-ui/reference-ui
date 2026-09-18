// Shared agent-side case index: MiniSearch over neo cases + RS surfaces.
//
// Sources: packages/reference-neo/tests/cases/**/case.json (+ sibling
// README.md / specs/*.spec.ts; world/ is NEVER indexed) and
// packages/reference-rs/modules/* (via rs-adapter.mjs). The README is the
// index: no metadata sidecar. Persisted to .cache/ with a content-hash
// manifest; the index rebuilds when source hashes or the indexer version
// below change.

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniSearch from 'minisearch';
import { collectRsDocs, firstParagraph, inferRelated, RS_MODULES_DIR } from './rs-adapter.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CACHE_DIR = join(ROOT, '.agents', 'case-index', '.cache');
export const INDEX_PATH = join(CACHE_DIR, 'index.json');
export const MANIFEST_PATH = join(CACHE_DIR, 'manifest.json');
export const NEO_CASES_DIR = 'packages/reference-neo/tests/cases';

// Bump when the tokenizer, stemmer, or doc-shaping below changes: the
// manifest check rebuilds cached indexes built by older indexer code.
export const INDEX_VERSION = 4;

// Split on anything that is not a letter or digit, so hyphen compounds
// (data-color-mode), backtick-quoted code (`css()`), paths (extract/css),
// and snake_case all index as their useful parts. MiniSearch's default
// only splits \p{P}, which leaves "`data" / "mode`" junk terms behind.
export function tokenize(text) {
  return String(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// Porter stemmer (M. Porter, public domain): fold singular/plural and
// inflections (queries/query, arrays/array, diagnostics/diagnostic) so
// both sides of the index use one term. Applied in processTerm only to
// pure lowercase alpha terms; ids, versions, and dimensions pass through.
function porterConsonant(s, i) {
  if (i < 0 || i >= s.length) return false;
  const ch = s[i];
  if (ch === 'y') return i === 0 || !porterConsonant(s, i - 1);
  return !'aeiou'.includes(ch);
}

function porterMeasure(s) {
  let n = 0;
  for (let i = 1; i < s.length; i++) {
    if (porterConsonant(s, i) && !porterConsonant(s, i - 1)) n++;
  }
  return n;
}

function porterCvc(s) {
  const e = s.length;
  return e >= 3 &&
    porterConsonant(s, e - 1) && !porterConsonant(s, e - 2) &&
    porterConsonant(s, e - 3) && !'wxy'.includes(s[e - 1]);
}

function porterHasVowel(s) {
  for (let i = 0; i < s.length; i++) if (!porterConsonant(s, i)) return true;
  return false;
}

const PORTER_STEP2 = [
  ['ational', 'ate'], ['tional', 'tion'], ['enci', 'ence'], ['anci', 'ance'],
  ['izer', 'ize'], ['bli', 'ble'], ['alli', 'al'], ['entli', 'ent'],
  ['eli', 'e'], ['ousli', 'ous'], ['ization', 'ize'], ['ation', 'ate'],
  ['ator', 'ate'], ['alism', 'al'], ['iveness', 'ive'], ['fulness', 'ful'],
  ['ousness', 'ous'], ['aliti', 'al'], ['iviti', 'ive'], ['biliti', 'ble'],
  ['logi', 'log'],
];
const PORTER_STEP3 = [
  ['icate', 'ic'], ['ative', ''], ['alize', 'al'], ['iciti', 'ic'],
  ['ical', 'ic'], ['ful', ''], ['ness', ''],
];
const PORTER_STEP4 = [
  'al', 'ance', 'ence', 'er', 'ic', 'able', 'ible', 'ant', 'ement',
  'ment', 'ent', 'ion', 'ou', 'ism', 'ate', 'iti', 'ous', 'ive', 'ize',
];

function porterStem(w) {
  // Step 1a.
  if (w.endsWith('sses')) w = w.slice(0, -2);
  else if (w.endsWith('ies')) w = w.slice(0, -2);
  else if (!w.endsWith('ss') && w.endsWith('s')) w = w.slice(0, -1);
  // Step 1b.
  let step1b = false;
  if (w.endsWith('eed')) {
    if (porterMeasure(w.slice(0, -3)) > 0) w = w.slice(0, -1);
  } else if (w.endsWith('ed') && porterHasVowel(w.slice(0, -2))) {
    w = w.slice(0, -2);
    step1b = true;
  } else if (w.endsWith('ing') && porterHasVowel(w.slice(0, -3))) {
    w = w.slice(0, -3);
    step1b = true;
  }
  if (step1b) {
    if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz')) w += 'e';
    else if (w.length >= 2 && w[w.length - 1] === w[w.length - 2] &&
      porterConsonant(w, w.length - 1) && !'lsz'.includes(w[w.length - 1])) {
      w = w.slice(0, -1);
    } else if (porterMeasure(w) === 1 && porterCvc(w)) w += 'e';
  }
  // Step 1c.
  if (w.endsWith('y') && porterHasVowel(w.slice(0, -1))) w = w.slice(0, -1) + 'i';
  // Step 2 (m > 0).
  for (const [suf, repl] of PORTER_STEP2) {
    if (w.endsWith(suf) && porterMeasure(w.slice(0, -suf.length)) > 0) {
      w = w.slice(0, -suf.length) + repl;
      break;
    }
  }
  // Step 3 (m > 0).
  for (const [suf, repl] of PORTER_STEP3) {
    if (w.endsWith(suf) && porterMeasure(w.slice(0, -suf.length)) > 0) {
      w = w.slice(0, -suf.length) + repl;
      break;
    }
  }
  // Step 4 (m > 1; ion only after s/t).
  for (const suf of PORTER_STEP4) {
    if (!w.endsWith(suf)) continue;
    const stem = w.slice(0, -suf.length);
    if (porterMeasure(stem) <= 1) break;
    if (suf === 'ion' && !'st'.includes(stem[stem.length - 1])) break;
    w = stem;
    break;
  }
  // Step 5.
  if (w.endsWith('e')) {
    const stem = w.slice(0, -1);
    const m = porterMeasure(stem);
    if (m > 1 || (m === 1 && !porterCvc(stem))) w = stem;
  }
  if (w.endsWith('ll') && porterMeasure(w) > 1) w = w.slice(0, -1);
  return w;
}

export function stem(term) {
  if (!/^[a-z]{3,}$/.test(term)) return term;
  return porterStem(term);
}

export function processTerm(term) {
  const lower = term.toLowerCase();
  if (lower.length < 2) return undefined; // drop 1-char junk ("n" from N-API, "'s" splits)
  return stem(lower);
}

function findCaseJsonFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) findCaseJsonFiles(full, out);
    else if (entry === 'case.json') out.push(full);
  }
  return out;
}

function findSpecFiles(specsDir, out = []) {
  // Authorial Playwright specs only. world/ (generated dist, vendored
  // node_modules) is never walked, anywhere in the indexer.
  if (!existsSync(specsDir)) return out;
  const stack = [specsDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir).sort()) {
      if (entry === 'node_modules') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) stack.push(full);
      else if (entry.endsWith('.spec.ts')) out.push(full);
    }
  }
  return out.sort();
}

export function collectNeoDocs(root) {
  const docs = [];
  const hashFiles = [];
  const files = findCaseJsonFiles(join(root, NEO_CASES_DIR)).sort();
  for (const casePath of files) {
    const dir = dirname(casePath);
    let meta = {};
    try {
      meta = JSON.parse(readFileSync(casePath, 'utf8'));
    } catch {
      continue;
    }
    if (!meta.id) continue;
    hashFiles.push(casePath);
    const readmePath = join(dir, 'README.md');
    const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '';
    if (existsSync(readmePath)) hashFiles.push(readmePath);
    const specFiles = findSpecFiles(join(dir, 'specs'));
    hashFiles.push(...specFiles);
    const specs = specFiles
      .map((f) => `spec ${relative(dir, f)}:\n${readFileSync(f, 'utf8')}`)
      .join('\n');
    const family = relative(join(root, NEO_CASES_DIR), dir).split('/')[0];
    docs.push({
      id: meta.id,
      kind: 'neo',
      ref: family,
      title: meta.name || meta.id,
      description: firstParagraph(readme) || (meta.name || ''),
      readme,
      path: relative(root, dir),
      text: `${meta.id} ${meta.name || ''}\n${readme}\n${specs}`,
      related: inferRelated(readme, meta.id),
    });
  }
  return { docs, hashFiles };
}

export function collectAllDocs(root = ROOT) {
  const neo = collectNeoDocs(root);
  const rs = collectRsDocs(root);
  return {
    docs: [...neo.docs, ...rs.docs],
    hashFiles: [...neo.hashFiles, ...rs.hashFiles],
    hashInventory: [...(rs.hashInventory || [])],
  };
}

export function hashSources(hashFiles, root = ROOT, hashInventory = []) {
  // Paths relative + contents hashed, so renames and edits both rebuild.
  // Inventory strings (suite paths, case ids) catch drift in files whose
  // contents are out of scope for the index.
  const h = createHash('sha256');
  for (const f of [...hashFiles].sort()) {
    h.update(relative(root, f));
    h.update('\0');
    h.update(readFileSync(f));
    h.update('\0');
  }
  for (const s of [...hashInventory].sort()) {
    h.update(s);
    h.update('\0');
  }
  return h.digest('hex');
}

function toIndexDoc(doc) {
  return {
    id: doc.id,
    kind: doc.kind,
    ref: doc.ref,
    title: doc.title,
    description: doc.description || '',
    readme: doc.readme || '',
    path: doc.path,
    text: doc.text,
    inventory: doc.inventory || '',
    related: doc.related || [],
    suiteCount: doc.suiteCount,
    caseCount: doc.caseCount,
  };
}

// `inventory` (rs suite paths + golden ids) lives outside `text` so a
// 148-case inventory does not drown the module's own README prose in BM25
// length normalization; it stays searchable for id-resolution queries.
export const MINI_FIELDS = ['title', 'text', 'inventory', 'id'];
export const MINI_STORE_FIELDS = ['id', 'kind', 'ref', 'title', 'description', 'readme', 'path', 'related', 'suiteCount', 'caseCount'];
export const MINI_SEARCH_OPTIONS = {
  boost: { title: 3, id: 4 },
  prefix: true,
  fuzzy: 0.2,
};

export function miniOptions() {
  // One option set for build, load, and query: MiniSearch serializes no
  // functions, so the cache load must re-attach tokenize/processTerm or
  // queries silently fall back to the default tokenizer.
  return {
    fields: MINI_FIELDS,
    storeFields: MINI_STORE_FIELDS,
    tokenize,
    processTerm,
    searchOptions: MINI_SEARCH_OPTIONS,
  };
}

export function buildMiniSearch(docs) {
  const ms = new MiniSearch(miniOptions());
  ms.addAll(docs.map(toIndexDoc));
  return ms;
}

export function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return null;
  }
}

export function reindex(root = ROOT) {
  const { docs, hashFiles, hashInventory } = collectAllDocs(root);
  const hash = hashSources(hashFiles, root, hashInventory);
  const ms = buildMiniSearch(docs);
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(INDEX_PATH, JSON.stringify(ms.toJSON()));
  const manifest = {
    version: INDEX_VERSION,
    hash,
    builtAt: new Date().toISOString(),
    counts: {
      neo: docs.filter((d) => d.kind === 'neo').length,
      rs: docs.filter((d) => d.kind === 'rs').length,
      total: docs.length,
    },
    files: hashFiles.length,
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  return { ms, docs, manifest, rebuilt: true };
}

export function isFresh(manifest, hash) {
  return !!manifest && manifest.version === INDEX_VERSION && manifest.hash === hash;
}

export function loadIndex(root = ROOT) {
  // Rebuild when source hashes or the indexer version changed; otherwise
  // load from disk. Every search/list call re-verifies, never trusts mtime.
  const { docs, hashFiles, hashInventory } = collectAllDocs(root);
  const hash = hashSources(hashFiles, root, hashInventory);
  const manifest = readManifest();
  if (isFresh(manifest, hash) && existsSync(INDEX_PATH)) {
    try {
      const ms = MiniSearch.loadJSON(readFileSync(INDEX_PATH, 'utf8'), miniOptions());
      return { ms, docs, manifest, rebuilt: false };
    } catch {
      // Corrupt cache falls through to rebuild.
    }
  }
  return reindex(root);
}
