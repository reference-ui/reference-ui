// integer-carve.ts — the integer-key substrate carve (doom-5, fortify-5)
// behind the NEO-NAMER-01 differential. V8 destroys author order for 2+
// integer-like per-prop keys before any namer code runs, so on exact-failure
// under the narrow trigger the comparison normalizes across per-prop members
// while every member block stays order-pinned within. Takes plan values,
// member blocks, and oracle lists; emits trigger verdicts, carved verdicts,
// and per-member kept blocks.
import type { RuntimeStylePlan } from '@reference-ui/rust/contracts';
import { declKey, type GateDeclaration } from './surplus-gate.ts';

// The namer's shape the block decomposition re-runs: one authored request
// to its declaration list. Structural on purpose — the differential's
// RuntimeNamer satisfies it without importing engine types.
interface CarveNamerRequest {
  prop: string;
  value: unknown;
  when: string[];
  important: boolean;
}

interface CarveNamer {
  name(request: CarveNamerRequest, tables: unknown, system?: string): GateDeclaration[];
}

// INTEGER-KEY SUBSTRATE CARVE (doom-5, NEO-NAMER-01/R3). V8
// [[OwnPropertyKeys]] enumerates canonical numeric keys ascending at object
// creation, so author order for 2+ integer-like per-prop keys is DESTROYED
// before any namer code runs — the namer can only ever emit V8 order while
// the oracle (preserve_order) emits author order. No fixed emission order
// matches all authorings, so this is UNSOLVABLE at runtime; the namer is
// correct to emit in the order it receives. The carve is a narrow gate:
// order-exact FIRST (unchanged — ascending-authored and non-integer plans
// clear exactly as today), and only on exact-failure with 2+ integer-like
// keys does the comparison normalize ACROSS per-prop members. Within-member
// order stays fully pinned: each member's block (trio W→S→C, trbl,
// ring+offset, and macro expansions all live inside one member block, one
// shapeMember run over the lowering pairs) compares order-exactly as a
// contiguous run; only the block SEQUENCE is freed. Decomposition re-runs
// the namer itself on single-key requests — the same shapeObject path with
// one iteration, so breakpoint and condition members decompose exactly —
// and a tripwire refuses to forgive when the re-runs stop reproducing the
// full list. Known residual: inside a triggered plan, swapped string-keyed
// members are forgiven along with the integer reorder (the integer-first
// rule displaces every member, so tighter attribution would need search;
// the trigger's rarity bounds the hole). Witness: color {"10": red, "2":
// blue} — oracle [10,2], namer [2,10]. Report: the doom-5 key-order
// break under .agents/doom/logs/ (2026-09-20).

// V8 canonical numeric index: decimal digits with no leading zeros unless
// "0" itself, and below 2^32-1 (which V8 keeps insertion-ordered).
export function isIntegerLikeKey(key: string): boolean {
  if (!/^(0|[1-9][0-9]*)$/.test(key)) return false;
  return Number(key) < 4294967295;
}

// True for a per-prop object: the shape.ts isPerPropObject mirror (plain
// object, no $r, no $token).
function isPerPropValue(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return !('$r' in value) && !('$token' in value);
}

// THE PREDICATE: a per-prop object holding 2+ integer-like keys.
// Order-blind by construction — the JS-observable object is ALWAYS in V8
// order, so the "non-V8 order" half of the trigger is the order-exact
// failure that must precede every carve.
export function wantsIntegerCarve(value: unknown): boolean {
  if (!isPerPropValue(value)) return false;
  let seen = 0;
  for (const key of Object.keys(value)) {
    if (isIntegerLikeKey(key)) seen++;
  }
  return seen >= 2;
}

function declEqual(a: GateDeclaration, b: GateDeclaration): boolean {
  return a.slot === b.slot && a.className === b.className;
}

export function sameSequence(a: GateDeclaration[], b: GateDeclaration[]): boolean {
  return a.length === b.length && a.every((d, i) => declEqual(d, b[i]));
}

// First index where kept and oracle differ (-1 when order-exact). Lengths
// are already equal at every call site.
export function firstDriftIndex(kept: GateDeclaration[], oracle: GateDeclaration[]): number {
  return kept.findIndex((k, i) => !declEqual(k, oracle[i]));
}

// True when the block matches the oracle contiguously starting at pos.
function blockMatchesAt(block: GateDeclaration[], oracle: GateDeclaration[], pos: number): boolean {
  if (pos + block.length > oracle.length) return false;
  return block.every((d, i) => declEqual(d, oracle[pos + i]));
}

// Backtracking cover search: every block consumed exactly once, the oracle
// fully covered. Greedy would misattribute on shared prefixes (block [X,Y]
// vs block [X] at oracle [X,Y]) and red a valid permutation; the search is
// complete so only real drift fails.
function coversWithBlocks(
  blocks: GateDeclaration[][],
  oracle: GateDeclaration[],
  pos: number,
  used: boolean[],
): boolean {
  if (pos === oracle.length) return used.every((u) => u);
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (used[i] === true) continue;
    if (!blockMatchesAt(block, oracle, pos)) continue;
    used[i] = true;
    if (coversWithBlocks(blocks, oracle, pos + block.length, used)) return true;
    used[i] = false;
  }
  return false;
}

// Pure permutation check: the oracle is a concatenation of the member
// blocks in some order, each contiguous and order-exact within. Empty
// blocks (refused members) constrain nothing and match vacuously.
export function carveBlocksAgree(blocks: GateDeclaration[][], oracle: GateDeclaration[]): boolean {
  const solid = blocks.filter((b) => b.length > 0);
  return coversWithBlocks(solid, oracle, 0, solid.map(() => false));
}

// The carved comparison verdict: order-exact, carved (a block permutation
// under the integer trigger), or fail. One decision function so the
// gate-matrix rows eval the FILE's verdict, never a copy.
export type IntegerVerdict = 'exact' | 'carved' | 'fail';

export function integerVerdict(
  blocks: GateDeclaration[][],
  oracle: GateDeclaration[],
  trigger: boolean,
): IntegerVerdict {
  if (sameSequence(blocks.flat(), oracle)) return 'exact';
  if (trigger && carveBlocksAgree(blocks, oracle)) return 'carved';
  return 'fail';
}

// Decompose one triggered plan into per-member kept blocks by re-running
// the namer on single-key requests (the same shapeObject path with one
// iteration — breakpoint and condition members decompose exactly), then
// replaying the surplus pass per member in V8 key order so the kept blocks
// concatenate to exactly the global kept list.
export function keptMemberBlocks(
  namer: CarveNamer,
  tables: unknown,
  plan: RuntimeStylePlan,
  oracleCounts: Map<string, number>,
): GateDeclaration[][] {
  const value = plan.value as Record<string, unknown>;
  const running = new Map<string, number>();
  const blocks: GateDeclaration[][] = [];
  for (const key of Object.keys(value)) {
    const full = namer.name(
      { prop: plan.prop, value: { [key]: value[key] }, when: plan.when, important: plan.important },
      tables,
      plan.system,
    );
    const kept: GateDeclaration[] = [];
    for (const d of full) {
      const dkey = declKey(d);
      const index = running.get(dkey) ?? 0;
      running.set(dkey, index + 1);
      if (index < (oracleCounts.get(dkey) ?? 0)) kept.push(d);
    }
    blocks.push(kept);
  }
  return blocks;
}
