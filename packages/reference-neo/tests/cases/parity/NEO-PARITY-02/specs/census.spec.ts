// census.spec.ts — spec for NEO-PARITY-02, the lib-family census. Takes
// { case } from the runner with the mini-lib world freshly synced; the page
// stays parked because the census is node-side over the synced sheet. Emits
// nothing on success; throws naming the first family marker, absence cite,
// union transcription drift, or blocked row that fails on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { BLOCKED, FAMILIES } from './census-families.ts';
import { UNION } from './census-union.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface ParsedEntry {
  group: string;
  kind: 'approved' | 'oos' | 'parity';
  label: string;
}

function specPath(c: NeoCase, group: string): string {
  return path.join(c.dir, '..', '..', group, 'SPEC.md');
}

function testsPath(c: NeoCase, group: string): string {
  return path.join(c.dir, '..', '..', group, 'TESTS.md');
}

// Parses the parity SPEC §union table into group/kind/label entries. Cells
// rejoin on '|' because one label carries literal pipes; approved and
// out-of-scope halves split on '‖', entries on '·'. The parity-owned row
// has no halves and becomes one kind:parity entry.
function parseUnionTable(c: NeoCase): { entries: ParsedEntry[]; counts: Map<string, [number, number]> } {
  const text = fs.readFileSync(path.join(c.dir, '..', 'SPEC.md'), 'utf8');
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.startsWith('| Group |'));
  assert.ok(start >= 0, 'parity SPEC carries the union table');
  const entries: ParsedEntry[] = [];
  const counts = new Map<string, [number, number]>();
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith('|')) break;
    const cells = line.split('|').map((cell) => cell.trim());
    const groupCell = cells[1] ?? '';
    const nCell = cells[2] ?? '';
    const body = cells
      .slice(3)
      .join('|')
      .replace(/\|$/, '')
      .replace(/\\\|/g, '|')
      .trim();
    if (groupCell.includes('parity')) {
      entries.push({ group: 'parity', kind: 'parity', label: body });
      counts.set('parity', [1, 0]);
      continue;
    }
    const group = groupCell;
    const halves = body.split('‖').map((half) => half.trim());
    assert.equal(halves.length, 2, `union row ${group} splits approved from out-of-scope`);
    const kinds: Array<'approved' | 'oos'> = ['approved', 'oos'];
    const pair: [number, number] = [0, 0];
    halves.forEach((half, index) => {
      for (const label of half.split('·').map((entry) => entry.trim())) {
        entries.push({ group, kind: kinds[index] as 'approved' | 'oos', label });
        pair[index] += 1;
      }
    });
    counts.set(group, pair);
    assert.equal(`${pair[0]}+${pair[1]}`, nCell, `union row ${group} matches its n column`);
  }
  return { entries, counts };
}

function tripleKey(group: string, kind: string, label: string): string {
  return `${group}‖${kind}‖${label}`;
}

// The checked-in list equals the SPEC table exactly: same multiset of
// group/kind/label triples, same per-group counts, 151 entries total.
function checkTranscription(entries: ParsedEntry[], counts: Map<string, [number, number]>): void {
  assert.equal(UNION.length, 152, `checked-in union holds 152 entries, got ${UNION.length}`);
  assert.equal(entries.length, 152, `SPEC table holds 152 entries, got ${entries.length}`);
  const wanted = new Map<string, number>();
  for (const entry of entries) {
    const k = tripleKey(entry.group, entry.kind, entry.label);
    wanted.set(k, (wanted.get(k) ?? 0) + 1);
  }
  for (const entry of UNION) {
    const k = tripleKey(entry.group, entry.kind, entry.label);
    assert.ok((wanted.get(k) ?? 0) > 0, `checked-in entry matches the SPEC table: ${entry.id} ${entry.label}`);
    wanted.set(k, (wanted.get(k) ?? 1) - 1);
  }
  for (const [group, pair] of counts) {
    if (group === 'parity') continue;
    const approved = UNION.filter((entry) => entry.group === group && entry.kind === 'approved').length;
    const oos = UNION.filter((entry) => entry.group === group && entry.kind === 'oos').length;
    assert.deepEqual([approved, oos], pair, `group ${group} keeps its approved+oos counts`);
  }
}

// Every entry is really claimed by its owner's SPEC: the grounding
// keyword lands in the owner file, so a deleted SPEC line fails here.
function checkOwnerGrounding(c: NeoCase): void {
  const specCache = new Map<string, string>();
  const ownerText = (group: string): string => {
    const cached = specCache.get(group);
    if (cached !== undefined) return cached;
    const file = group === 'parity' ? path.join(c.dir, '..', 'SPEC.md') : specPath(c, group);
    const text = fs.readFileSync(file, 'utf8').toLowerCase();
    specCache.set(group, text);
    return text;
  };
  for (const entry of UNION) {
    assert.ok(
      ownerText(entry.group).includes(entry.key.toLowerCase()),
      `${entry.id} is claimed by ${entry.group}/SPEC.md (${entry.key})`,
    );
  }
}

// The 43 families: every marker prints in the sheet, every must-not
// string stays out, every absence cite resolves into the union, and
// every blocked cite names a known-unproven row from the table below.
function checkFamilies(styles: string): void {
  const ids = new Set(UNION.map((entry) => entry.id));
  const blockedRows = new Set(BLOCKED.map((row) => row.row));
  assert.equal(FAMILIES.length, 43, `census holds 43 families, got ${FAMILIES.length}`);
  for (const family of FAMILIES) {
    for (const marker of family.markers) {
      assert.ok(styles.includes(marker), `${family.id} prints in the sheet: ${marker.slice(0, 64)}`);
    }
    for (const missing of family.absent) {
      assert.ok(!styles.includes(missing), `${family.id} keeps out of the sheet: ${missing}`);
    }
    for (const cite of family.union) {
      assert.ok(ids.has(cite), `${family.id} cites a union entry: ${cite}`);
    }
    for (const cite of family.blocked) {
      assert.ok(blockedRows.has(cite), `${family.id} cites a known-unproven row: ${cite}`);
    }
    assert.ok(
      family.markers.length + family.union.length + family.blocked.length > 0,
      `${family.id} carries evidence`,
    );
  }
}

// The 12 known-unproven rows still read blocked-on-rs with their RS
// owners in their group ledgers — shown, never silently missing.
function checkBlocked(c: NeoCase): void {
  assert.equal(BLOCKED.length, 12, `census shows 12 known-unproven rows, got ${BLOCKED.length}`);
  for (const row of BLOCKED) {
    const ledger = fs.readFileSync(testsPath(c, row.group), 'utf8');
    const line = ledger.split('\n').find((candidate) => candidate.includes(`| ${row.row} |`));
    assert.ok(line !== undefined, `${row.row} still has a ledger row`);
    assert.ok(line.includes('blocked-on-rs'), `${row.row} still reads blocked-on-rs`);
    assert.ok(line.includes(row.rs), `${row.row} still cites ${row.rs}`);
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
  const { entries, counts } = parseUnionTable(c);
  checkTranscription(entries, counts);
  checkOwnerGrounding(c);
  checkFamilies(styles);
  checkBlocked(c);
}
