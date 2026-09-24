// parity.ts — shared set-parity helpers for the PGEN station specs. Takes the
// vendored E1/E4 shelf, the live RS tables, and candidate sets, and emits loud
// diffs naming every missing or extra member. It owns no verdict on its own:
// each spec feeds it the three legs of its parity triangle plus corrupted
// copies that must trip the same diff, proving the gate fails loud on drift.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT: string = path.resolve(HERE, '..', '..', '..', '..');

export interface ShelfElement {
  dom: string;
  jsx: string;
  family: string;
}

export interface ShelfVocabulary {
  version: string;
  elements: ShelfElement[];
  stylePropNames: string[];
  conditions: string[];
  conditionRule: string;
  aliases: Record<string, string>;
  reserved: string[];
  elementOverrides: Record<string, string>;
}

// The committed shelf is the middle leg of every parity triangle: E1
// vocabulary as parsed data plus the raw E4 declaration text for union
// extraction. Paths resolve from this file, never from the caller's world.
export function shelfDir(): string {
  return path.join(PACKAGE_ROOT, 'src', 'native', 'generated', 'primitives');
}

export function readShelfVocabulary(): ShelfVocabulary {
  const raw = fs.readFileSync(path.join(shelfDir(), 'vocabulary.json'), 'utf8');
  return JSON.parse(raw) as ShelfVocabulary;
}

export function readShelfDts(): string {
  return fs.readFileSync(path.join(shelfDir(), 'primitives.d.ts'), 'utf8');
}

// The linked workspace RS package is where live tables come from: canon's
// Rust sources for the roster, the typegen napi for prop names. The entries
// resolve as file paths, not through the exports map, since the RS package
// does not expose its package.json (same approach as the vendor tool).
export function rustPackageDir(): string {
  const pkgFile = path.join(PACKAGE_ROOT, 'node_modules', '@reference-ui', 'rust', 'package.json');
  if (!fs.existsSync(pkgFile)) {
    throw new Error(`[pgen] cannot find the linked @reference-ui/rust at ${pkgFile}; run pnpm install first.`);
  }
  return path.dirname(pkgFile);
}

export function readCanonSource(file: string): string {
  return fs.readFileSync(path.join(rustPackageDir(), 'modules', 'canon', 'src', file), 'utf8');
}

// One quoted-string-per-line Rust block, the same discipline the RS generator
// uses to read its own tables: a missing marker, an unterminated block, or
// an unparseable line throws naming the file and the line, never skips.
export function parseRustStringBlock(source: string, file: string, marker: string): string[] {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => line.includes(marker));
  if (start < 0) throw new Error(`[pgen] ${file}: missing block ${marker}`);
  const end = lines.findIndex((line, index) => index > start && line.trim() === '];');
  if (end < 0) throw new Error(`[pgen] ${file}: unterminated block ${marker}`);
  const names: string[] = [];
  for (const line of lines.slice(start + 1, end)) {
    const match = /^\s*"([^"]+)",$/.exec(line);
    if (!match) throw new Error(`[pgen] ${file}: unparseable line: ${line.trim()}`);
    names.push(match[1]);
  }
  return names;
}

export interface CanonElement {
  dom: string;
  jsx: string;
}

// Canon's ELEMENTS table carries (html, jsx) pairs per row; the row shape is
// pinned so a generator-side reformat fails this parse loudly instead of
// silently comparing against an empty or partial roster.
export function parseElementsTable(htmlRs: string): CanonElement[] {
  const lines = htmlRs.split('\n');
  const start = lines.findIndex((line) => line.includes('pub const ELEMENTS'));
  if (start < 0) throw new Error('[pgen] html.rs: missing block pub const ELEMENTS');
  const end = lines.findIndex((line, index) => index > start && line.trim() === '];');
  if (end < 0) throw new Error('[pgen] html.rs: unterminated block pub const ELEMENTS');
  const rows: CanonElement[] = [];
  for (const line of lines.slice(start + 1, end)) {
    const match = /^\s*Element::new\("([^"]+)", "([^"]+)"\),$/.exec(line);
    if (!match) throw new Error(`[pgen] html.rs: unparseable ELEMENTS line: ${line.trim()}`);
    rows.push({ dom: match[1], jsx: match[2] });
  }
  return rows;
}

export interface SetDiff {
  missing: string[];
  extra: string[];
}

// Pure set difference over sorted copies: missing members sort first so
// drift reports read deterministically across runs and platforms.
export function diffSets(expected: readonly string[], actual: readonly string[]): SetDiff {
  const have = new Set(actual);
  const want = new Set(expected);
  const missing = [...want].filter((name) => !have.has(name)).sort();
  const extra = [...have].filter((name) => !want.has(name)).sort();
  return { missing, extra };
}

function formatDiff(diff: SetDiff, cap: number): string {
  const parts: string[] = [];
  if (diff.missing.length > 0) parts.push(`missing: ${diff.missing.slice(0, cap).join(', ')}`);
  if (diff.extra.length > 0) parts.push(`extra: ${diff.extra.slice(0, cap).join(', ')}`);
  return parts.join('; ');
}

// The loud gate: equal sets pass silent, any drift throws naming the label,
// the sizes, and the first members each side. Specs call this on live data
// and separately prove it trips by feeding it corrupted copies.
export function assertSetsEqual(label: string, expected: readonly string[], actual: readonly string[]): void {
  const diff = diffSets(expected, actual);
  if (diff.missing.length === 0 && diff.extra.length === 0) return;
  throw new Error(
    `[pgen] ${label}: drift (${expected.length} expected, ${actual.length} actual): ${formatDiff(diff, 12)}`,
  );
}

// Drift-injection proof: the same diff that guards live data must name the
// corrupted member when fed a tampered COPY. A gate that cannot see injected
// drift is decoration, so this throws when the diff stays silent or vague.
export function assertDetectsDrift(
  label: string,
  expected: readonly string[],
  corrupted: readonly string[],
  mustName: string,
): void {
  const diff = diffSets(expected, corrupted);
  const named = [...diff.missing, ...diff.extra];
  if (!named.includes(mustName)) {
    throw new Error(
      `[pgen] ${label}: drift injection of ${mustName} went undetected (${formatDiff(diff, 12) || 'no diff'})`,
    );
  }
}
