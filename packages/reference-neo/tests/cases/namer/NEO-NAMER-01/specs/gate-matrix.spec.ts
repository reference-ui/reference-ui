// gate-matrix.spec.ts — pins the 20-case form-gate matrix behind the
// differential's widened carve (fortify-4 T1). Takes the gate pieces
// imported from the sibling differential spec, so every verdict evals
// the FILE's regex, never a copy. Pure assertions, no page use; throws
// naming the first row whose arm verdicts drift on failure.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import {
  BRACED_STEM,
  BRACELESS_REFUSAL,
  clearsFormGate,
} from './differential.spec.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface GateRow {
  label: string;
  className: string;
  wantOld: boolean;
  wantNew: boolean;
}

// The matrix: [label, class stem, braced-arm verdict, braceless-arm
// verdict]. Blank-set rows hinge on Rust str::trim's blank class (L1 25,
// FEFF excluded — String#trim would lie there): FEFF/ZWSP interiors are
// non-blank so the oracle refuses and the tail arm admits; NBSP/NEL/CR
// interiors are blank so the oracle keeps and the tail arm excludes.
// All wash through escape-sequence spellings — never literal control or
// non-ASCII chars in this file (fortify-4 TYPECHECK incident).
const ROWS: GateRow[] = [
  { label: 'FEFF-refuse', className: 'p_{\uFEFF}', wantOld: true, wantNew: true },
  { label: 'NBSP-keep', className: 'p_{\u00A0}', wantOld: true, wantNew: false },
  { label: 'U+0085-keep', className: 'p_{\u0085}', wantOld: true, wantNew: false },
  { label: 'CR-keep', className: 'p_{\r}', wantOld: true, wantNew: false },
  { label: 'ZWSP-refuse', className: 'p_{\u200B}', wantOld: true, wantNew: true },
  { label: 'kept-{{}}', className: 'p_{{}}', wantOld: true, wantNew: false },
  { label: 'kept-{{a}', className: 'p_{{a}', wantOld: true, wantNew: false },
  { label: 'kept-{}', className: 'p_{}', wantOld: false, wantNew: false },
  { label: 'kept-{', className: 'p_{', wantOld: false, wantNew: false },
  { label: 'kept-{bar', className: 'p_{bar', wantOld: false, wantNew: false },
  { label: 'kept-foo}', className: 'p_foo}', wantOld: false, wantNew: false },
  { label: 'drift-x_foo}', className: 'x_foo}', wantOld: false, wantNew: false },
  { label: 'drift-x_foo', className: 'x_foo', wantOld: false, wantNew: false },
  { label: 'pin-{}}', className: 'bd-c_{}}', wantOld: false, wantNew: true },
  { label: 'pair-{a}', className: 'bd-c_{a}', wantOld: true, wantNew: true },
  { label: 'pair-nope', className: 'bd-c_{colors.nope}', wantOld: true, wantNew: true },
  { label: 'fold-{_}', className: 'bd-c_{_}', wantOld: true, wantNew: true },
  { label: 'important-{a}!', className: 'bd-c_{a}!', wantOld: true, wantNew: true },
  { label: 'blank-pair-{ }', className: 'bd-c_{ }', wantOld: true, wantNew: false },
  { label: 'multi-{a}{b}', className: 'bd-c_{a}{b}', wantOld: true, wantNew: false },
];

export default async function run({ page, case: c }: SpecInput): Promise<void> {
  void page;
  void c;
  assert.equal(ROWS.length, 20, `the gate matrix holds 20 rows, got ${ROWS.length}`);
  for (const row of ROWS) {
    assert.equal(
      BRACED_STEM.test(row.className),
      row.wantOld,
      `${row.label}: braced-arm verdict drift on ${JSON.stringify(row.className)}`,
    );
    assert.equal(
      BRACELESS_REFUSAL.test(row.className),
      row.wantNew,
      `${row.label}: braceless-arm verdict drift on ${JSON.stringify(row.className)}`,
    );
    assert.equal(
      clearsFormGate(row.className),
      row.wantOld || row.wantNew,
      `${row.label}: combined-gate verdict drift on ${JSON.stringify(row.className)}`,
    );
  }
}
