// differential.spec.ts — spec for NEO-NAMER-01, the differential gate. Takes
// { case } from the runner (the page only satisfies the served-world
// preflight; every assertion is node-side). Emits nothing on success;
// throws naming the first declaration where the runtime namer drifts from
// the compiled plans on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import type {
  EvaluatedSystemSpec,
  RuntimeStylePlan,
} from '@reference-ui/rust/contracts';
import {
  assertNoneMissing,
  collectKept,
  countBy,
  type GateDeclaration,
} from './surplus-gate.ts';
import {
  firstDriftIndex,
  integerVerdict,
  keptMemberBlocks,
  sameSequence,
  wantsIntegerCarve,
} from './integer-carve.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
// Read-only: the engine case inputs this differential recompiles.
const RS_CASES_DIR: string = path.resolve(
  HERE,
  '..',
  '..',
  '..',
  '..',
  '..',
  '..',
  'reference-rs',
  'modules',
  'atomic',
  'tests',
  'cases',
);
const LIB_SYSTEM_SPEC: string = path.resolve(
  HERE,
  '..',
  '..',
  '..',
  '..',
  '..',
  '..',
  'reference-rs',
  'modules',
  'atomic',
  'tests',
  'fixtures',
  'lib-system-spec.json',
);
const CASE_FOLDER = /^ATM-[A-Z]+-\d{2}$/;
const NAMER_SPECIFIER = '@reference-ui/rust/namer';

interface CompiledCase {
  id: string;
  plans: RuntimeStylePlan[];
  tables: unknown;
  sheet: string;
}

// The compiler result surface this gate reads: plans, the namer tables,
// and the emitted sheet the carve-out checks extras against. Structural
// on purpose — the gate never imports engine types.
interface CompilerResult {
  stylePlans: RuntimeStylePlan[];
  stylesheet: string;
  runtime?: { namer?: unknown };
}

interface AtomicModule {
  compile(request: unknown): Promise<CompilerResult>;
}

interface NamerRequest {
  prop: string;
  value: unknown;
  when: string[];
  important: boolean;
}

interface RuntimeNamer {
  name(request: NamerRequest, tables: unknown, system?: string): GateDeclaration[];
}

interface CaseInput {
  rootDir: string;
  baseSystem: EvaluatedSystemSpec;
  logs: string[];
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
}

function caseInput(caseDir: string): CaseInput {
  const baseSystemPath = path.join(caseDir, 'input', 'baseSystem.json');
  const baseSystem = (
    fs.existsSync(baseSystemPath) ? readJson(baseSystemPath) : readJson(LIB_SYSTEM_SPEC)
  ) as EvaluatedSystemSpec;
  // The gate reads the compile-internal plans, so it requests the proof channel.
  return { rootDir: path.join(caseDir, 'input'), baseSystem, logs: ['proof'] };
}

function toRequest(plan: RuntimeStylePlan): NamerRequest {
  return { prop: plan.prop, value: plan.value, when: plan.when, important: plan.important };
}

// Per-run carve telemetry: order-exact plans, trigger-true plans that
// still cleared exact (ascending controls), and carved plan labels.
interface CarveStats {
  exact: number;
  triggerExact: string[];
  carved: string[];
}

// The gate's per-plan context: namer, tables, sheet, and where-label for
// the case under comparison, plus the run's carve telemetry.
interface DifferentialGate {
  namer: RuntimeNamer;
  tables: unknown;
  sheet: string;
  where: string;
  stats: CarveStats;
}

// The differential core: the runtime namer over the authored request
// covers the compiled plan's declarations as an ORDERED LIST (slot,
// className, order, multiplicity — R3 pins every emit order), modulo the
// token-refusal carve-out for namer-side surplus. The matched subsequence
// must equal the oracle exactly, slot for slot in order — unless the
// integer-key substrate carve takes it (order-exact failure plus 2+
// integer-like keys, block-permuted across members, pinned within).
function expectEqual(gate: DifferentialGate, plan: RuntimeStylePlan): void {
  const { namer, tables, sheet, where, stats } = gate;
  const got = namer.name(toRequest(plan), tables, plan.system);
  const label = `${where}: ${plan.prop}=${JSON.stringify(plan.value)}`;
  const oracle = plan.declarations;
  const oracleCounts = countBy(oracle);
  const kept = collectKept(got, oracleCounts, sheet, label);
  assertNoneMissing(kept, oracle, label);
  assert.equal(kept.length, oracle.length, `${label}: declaration count drift`);
  const drift = firstDriftIndex(kept, oracle);
  if (drift === -1) {
    stats.exact++;
    if (wantsIntegerCarve(plan.value)) stats.triggerExact.push(label);
    return;
  }
  const k = kept[drift];
  const o = oracle[drift];
  const driftMsg =
    `${label}: order drift at declaration ${drift}: namer (${k.slot} ${k.className}) vs oracle (${o.slot} ${o.className})`;
  if (!wantsIntegerCarve(plan.value)) assert.fail(driftMsg);
  const keptBlocks = keptMemberBlocks(namer, tables, plan, oracleCounts);
  assert.ok(
    sameSequence(keptBlocks.flat(), kept),
    `${label}: member re-runs stop reproducing the namer list; refusing to carve`,
  );
  assert.equal(
    integerVerdict(keptBlocks, oracle, true),
    'carved',
    `${driftMsg} — integer carve rejects (not a member permutation)`,
  );
  stats.carved.push(label);
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  void c;
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const folders = fs
    .readdirSync(RS_CASES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && CASE_FOLDER.test(e.name))
    .map((e) => e.name)
    .sort();

  // Green half: the corpus recompiles and the oracle rows are present.
  assert.ok(folders.length > 200, `engine corpus holds hundreds of cases, got ${folders.length}`);
  const compiled: CompiledCase[] = [];
  for (const id of folders) {
    const result = await atomic.compile(caseInput(path.join(RS_CASES_DIR, id)));
    assert.ok(Array.isArray(result.stylePlans), `${id} surfaces compile-internal plans`);
    assert.equal(typeof result.stylesheet, 'string', `${id} surfaces its emitted sheet`);
    for (const plan of result.stylePlans) {
      assert.equal(typeof plan.prop, 'string', `${id} plans carry their request`);
      assert.ok(Array.isArray(plan.declarations), `${id} plans carry declarations`);
    }
    compiled.push({ id, plans: result.stylePlans, tables: result.runtime?.namer, sheet: result.stylesheet });
  }
  const declarations = compiled.reduce((n, cc) => n + cc.plans.length, 0);
  assert.ok(declarations > 1000, `corpus holds thousands of plans, got ${declarations}`);

  // Red half: the runtime namer resolves and meets every plan. The export
  // is missing until the namer lands beside the engine it mirrors. ESM
  // import: require.resolve cannot see import-only subpaths.
  let namer: RuntimeNamer;
  try {
    namer = (await import(NAMER_SPECIFIER)) as unknown as RuntimeNamer;
  } catch {
    assert.fail(`the runtime namer is missing: ${NAMER_SPECIFIER} does not resolve`);
  }
  assert.equal(typeof namer.name, 'function', 'the runtime namer exports name()');

  const stats: CarveStats = { exact: 0, triggerExact: [], carved: [] };
  for (const cc of compiled) {
    assert.ok(cc.tables !== undefined, `${cc.id} ships the namer tables`);
    for (const plan of cc.plans) {
      expectEqual({ namer, tables: cc.tables, sheet: cc.sheet, where: cc.id, stats }, plan);
    }
  }
  // Integer-pin assertions (doom-5, fortify-5): the NAME-08 non-ascending
  // plan clears via the new arm ONLY (it exact-fails first — the carve never
  // runs on an exact pass), and the ascending control clears via the old
  // arm. Exact-equality, so any unexpected carve fails loud.
  assert.deepEqual(stats.carved, ['ATM-NAME-08: color={"2":"blue","10":"red"}']);
  assert.deepEqual(stats.triggerExact, ['ATM-NAME-08: color={"2":"green","10":"yellow"}']);
}
