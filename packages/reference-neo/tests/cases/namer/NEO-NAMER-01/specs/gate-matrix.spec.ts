// gate-matrix.spec.ts — pins the 20-case form-gate matrix behind the
// differential's widened carve (fortify-4 T1) plus the integer-key carve
// matrices (fortify-5 doom-5). Takes the gate pieces imported from the
// sibling carve modules, so every verdict evals the FILE's predicate,
// never a copy. Pure assertions, no page use; throws naming the first
// row whose arm verdicts drift on failure.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import {
  BRACED_STEM,
  BRACELESS_REFUSAL,
  clearsFormGate,
} from './surplus-gate.ts';
import {
  carveBlocksAgree,
  integerVerdict,
  isIntegerLikeKey,
  wantsIntegerCarve,
  type IntegerVerdict,
} from './integer-carve.ts';

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

interface KeyRow {
  label: string;
  key: string;
  want: boolean;
}

// V8 [[OwnPropertyKeys]] fidelity: canonical numeric indices ascend first;
// 2^32-1, leading zeros, decimals, signs, and affixes stay
// insertion-ordered. Every verdict evals the FILE's predicate.
const KEY_ROWS: KeyRow[] = [
  { label: 'int-10', key: '10', want: true },
  { label: 'int-2', key: '2', want: true },
  { label: 'int-0', key: '0', want: true },
  { label: 'int-max', key: '4294967294', want: true },
  { label: 'notmax-2^32-1', key: '4294967295', want: false },
  { label: 'leading-00', key: '00', want: false },
  { label: 'leading-01', key: '01', want: false },
  { label: 'decimal-1.0', key: '1.0', want: false },
  { label: 'negative--1', key: '-1', want: false },
  { label: 'space-1', key: ' 1', want: false },
  { label: 'exp-1e2', key: '1e2', want: false },
  { label: 'unit-2xl', key: '2xl', want: false },
  { label: 'word-md', key: 'md', want: false },
  { label: 'empty', key: '', want: false },
  { label: 'huge', key: '99999999999999999999', want: false },
];

interface TriggerRow {
  label: string;
  value: unknown;
  want: boolean;
}

// The narrow trigger: per-prop objects holding 2+ integer-like keys.
// Order-blind (the JS-observable object is always V8-ordered); the
// "non-V8 order" half is the exact-failure that precedes every carve.
const TRIGGER_ROWS: TriggerRow[] = [
  { label: 'pair-nonas', value: { '10': 'r', '2': 'b' }, want: true },
  { label: 'pair-asc', value: { '2': 'b', '10': 'r' }, want: true },
  { label: 'trio', value: { '10': 'r', '2': 'b', b: 'g' }, want: true },
  { label: 'single', value: { '10': 'r' }, want: false },
  { label: 'one-int-one-str', value: { '10': 'r', b: 'g' }, want: false },
  { label: 'strings', value: { b: 'g', a: 'r' }, want: false },
  { label: 'array', value: ['1r', null], want: false },
  { label: 'scalar', value: 'red', want: false },
  { label: 'null', value: null, want: false },
  { label: 'r-shape', value: { $r: 2 }, want: false },
  { label: 'token-shape', value: { $token: { path: 'p', value: 'v' } }, want: false },
  { label: 'max-excluded', value: { '4294967295': 'r', '10': 'b' }, want: false },
  { label: 'leading-zero', value: { '01': 'r', '02': 'b' }, want: false },
];

interface TestDecl {
  slot: string;
  className: string;
}

interface IntegerRow {
  label: string;
  blocks: TestDecl[][];
  oracle: TestDecl[];
  trigger: boolean;
  wantChecker: boolean;
  wantVerdict: IntegerVerdict;
}

function decl(slot: string, className: string): TestDecl {
  return { slot, className };
}

// The carved verdicts: blocks in V8 key order, oracle in author order.
// pin-{10,2} is the old-red/new-green pin (exact fails, carve agrees);
// ascending clears via the OLD path (verdict exact — the differential
// short-circuits before the carve); drift-* rows must FAIL (within-block
// order pinned, wrong/extra/missing decls rejected, and a shuffled
// NON-integer plan unforgiven since its trigger is false).
const TEN = decl('10:color', 'sys__10:c_red');
const TWO = decl('2:color', 'sys__2:c_blue');
const BB = decl('b:color', 'sys__b:c_green');
const AA = decl('a:color', 'sys__a:c_yellow');
const BW = decl('bd-w:color', 'sys__bd-w_2px');
const BC = decl('bd-c:color', 'sys__bd-c_red');
const X = decl('x:color', 'sys__x:c_x');
const Y = decl('y:color', 'sys__y:c_y');

const INTEGER_ROWS: IntegerRow[] = [
  { label: 'pin-{10,2}', blocks: [[TWO], [TEN]], oracle: [TEN, TWO], trigger: true, wantChecker: true, wantVerdict: 'carved' },
  { label: 'ascending-{2,10}', blocks: [[TWO], [TEN]], oracle: [TWO, TEN], trigger: true, wantChecker: true, wantVerdict: 'exact' },
  { label: 'mixed', blocks: [[TEN], [TWO], [BB], [AA]], oracle: [BB, TEN, AA, TWO], trigger: true, wantChecker: true, wantVerdict: 'carved' },
  { label: 'single', blocks: [[X]], oracle: [X], trigger: false, wantChecker: true, wantVerdict: 'exact' },
  { label: 'drift-noninteger-shuffled', blocks: [[BB], [AA]], oracle: [AA, BB], trigger: false, wantChecker: true, wantVerdict: 'fail' },
  { label: 'drift-within-block', blocks: [[BW, BC], [X]], oracle: [BC, BW, X], trigger: true, wantChecker: false, wantVerdict: 'fail' },
  { label: 'drift-wrong-class', blocks: [[BB], [AA]], oracle: [BB, X], trigger: true, wantChecker: false, wantVerdict: 'fail' },
  { label: 'drift-extra-oracle', blocks: [[BB], [AA]], oracle: [BB, AA, X], trigger: true, wantChecker: false, wantVerdict: 'fail' },
  { label: 'drift-missing', blocks: [[BB], [AA]], oracle: [BB], trigger: true, wantChecker: false, wantVerdict: 'fail' },
  { label: 'empty-member', blocks: [[BB], [AA], []], oracle: [AA, BB], trigger: true, wantChecker: true, wantVerdict: 'carved' },
  { label: 'shared-prefix-backtrack', blocks: [[X], [X, Y]], oracle: [X, Y, X], trigger: true, wantChecker: true, wantVerdict: 'carved' },
  { label: 'dup-blocks', blocks: [[X], [X]], oracle: [X, X], trigger: true, wantChecker: true, wantVerdict: 'exact' },
  { label: 'trigger-false-exact', blocks: [[BB], [AA]], oracle: [BB, AA], trigger: false, wantChecker: true, wantVerdict: 'exact' },
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
  assert.equal(KEY_ROWS.length, 15, `the key matrix holds 15 rows, got ${KEY_ROWS.length}`);
  for (const row of KEY_ROWS) {
    assert.equal(
      isIntegerLikeKey(row.key),
      row.want,
      `${row.label}: integer-like verdict drift on ${JSON.stringify(row.key)}`,
    );
  }
  assert.equal(TRIGGER_ROWS.length, 13, `the trigger matrix holds 13 rows, got ${TRIGGER_ROWS.length}`);
  for (const row of TRIGGER_ROWS) {
    assert.equal(
      wantsIntegerCarve(row.value),
      row.want,
      `${row.label}: trigger verdict drift on ${JSON.stringify(row.value)}`,
    );
  }
  assert.equal(INTEGER_ROWS.length, 13, `the integer matrix holds 13 rows, got ${INTEGER_ROWS.length}`);
  for (const row of INTEGER_ROWS) {
    assert.equal(
      carveBlocksAgree(row.blocks, row.oracle),
      row.wantChecker,
      `${row.label}: checker verdict drift`,
    );
    assert.equal(
      integerVerdict(row.blocks, row.oracle, row.trigger),
      row.wantVerdict,
      `${row.label}: carved-verdict drift`,
    );
  }
}
