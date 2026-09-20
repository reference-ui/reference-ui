// differential.spec.ts — spec for NEO-NAMER-01, the differential gate. Takes
// { case } from the runner (the page only satisfies the served-world
// preflight; every assertion is node-side). Emits nothing on success;
// throws naming the first declaration where the runtime namer drifts from
// the compiled plans on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import type {
  EvaluatedSystemSpec,
  RuntimeStylePlan,
} from '@reference-ui/rust/contracts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const require = createRequire(import.meta.url);

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

interface Declaration {
  slot: string;
  className: string;
}

interface CompiledCase {
  id: string;
  plans: RuntimeStylePlan[];
  tables: unknown;
}

// The compiler result surface this gate reads: plans plus the namer
// tables. Structural on purpose — the gate never imports engine types.
interface CompilerResult {
  stylePlans: RuntimeStylePlan[];
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
  name(request: NamerRequest, tables: unknown): Declaration[];
}

interface CaseInput {
  rootDir: string;
  baseSystem: EvaluatedSystemSpec;
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
}

function caseInput(caseDir: string): CaseInput {
  const baseSystemPath = path.join(caseDir, 'input', 'baseSystem.json');
  const baseSystem = (
    fs.existsSync(baseSystemPath) ? readJson(baseSystemPath) : readJson(LIB_SYSTEM_SPEC)
  ) as EvaluatedSystemSpec;
  return { rootDir: path.join(caseDir, 'input'), baseSystem };
}

function toRequest(plan: RuntimeStylePlan): NamerRequest {
  return { prop: plan.prop, value: plan.value, when: plan.when, important: plan.important };
}

// The differential core: the runtime namer over the authored request
// equals the compiled plan's declarations, slot and className, in order.
function expectEqual(
  namer: RuntimeNamer,
  tables: unknown,
  plan: RuntimeStylePlan,
  where: string,
): void {
  const got = namer.name(toRequest(plan), tables);
  assert.deepEqual(
    got,
    plan.declarations,
    `${where}: the runtime namer drifts on ${plan.prop}=${JSON.stringify(plan.value)}`,
  );
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
    for (const plan of result.stylePlans) {
      assert.equal(typeof plan.prop, 'string', `${id} plans carry their request`);
      assert.ok(Array.isArray(plan.declarations), `${id} plans carry declarations`);
    }
    compiled.push({ id, plans: result.stylePlans, tables: result.runtime?.namer });
  }
  const declarations = compiled.reduce((n, cc) => n + cc.plans.length, 0);
  assert.ok(declarations > 1000, `corpus holds thousands of plans, got ${declarations}`);

  // Red half: the runtime namer resolves and meets every plan. The export
  // is missing until the namer lands beside the engine it mirrors.
  let namerEntry: string;
  try {
    namerEntry = require.resolve(NAMER_SPECIFIER);
  } catch {
    assert.fail(`the runtime namer is missing: ${NAMER_SPECIFIER} does not resolve`);
  }
  const namer = (await import(pathToFileURL(namerEntry).href)) as unknown as RuntimeNamer;
  assert.equal(typeof namer.name, 'function', 'the runtime namer exports name()');

  for (const cc of compiled) {
    assert.ok(cc.tables !== undefined, `${cc.id} ships the namer tables`);
    for (const plan of cc.plans) {
      expectEqual(namer, cc.tables, plan, cc.id);
    }
  }
}
