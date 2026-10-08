#!/usr/bin/env node
// cli.ts — the agentneo CLI, agent-facing entry point over the neo harness.
// Takes argv subcommands (list, search, run, q) and delegates to the case
// discovery, runner, and quality modules. Emits greppable stdout lines plus
// exit codes 0-3 (success, failure/usage, serve-only degrade, quality absent).
//
// agentneo: the agent-facing CLI over the neo test harness.
//
// Usage:
//   agentneo list               one greppable line per case
//   agentneo search <query>     substring filter over id, name, README text
//   agentneo run [id-or-prefix]  serve world + run specs headless (exact id wins, else prefix; all if omitted)
//   agentneo run --failed       rerun only cases recorded ok=false in the last-run log
//   agentneo run --update-snapshots --confirm
//                               bless fresh screenshots as snapshot baselines (human-gated)
//   agentneo q [paths...]       delegate to the quality gate
//   agentneo status            pass/fail/degraded counts per group from the last-run log
//
// Exit codes:
//   0  success (list/search always; run when every spec passed)
//   1  usage error, unknown case, spec failure, snapshot refusal, or unexpected error
//   2  serve-only degrade: playwright/browsers not resolvable, world served but no spec ran
//   3  quality gate not integrated yet (tools/quality/run.ts absent)

import { listCases, searchCases, matchCases, type NeoCase } from './cases.ts';
import { runCase, type RunResult } from './runner.ts';
import { checkTypes } from './typecheck.ts';
import { failedIds, LAST_RUN_FILE, orderFailFirst, readLastRun, summarizeByGroup, writeLastRun, type LastRunEntry, type LastRunLog } from './lastRun.ts';

interface QualityGate {
  runQuality: (argv: string[]) => Promise<number>;
}

function printCase(c: NeoCase): void {
  const desc = c.description ? `  ${c.description}` : '';
  console.log(`${c.id}  ${c.name}  ${c.folder}${desc}`);
}

async function cmdList(): Promise<number> {
  for (const c of listCases()) printCase(c);
  return 0;
}

async function cmdSearch(query: string | undefined): Promise<number> {
  if (!query) {
    console.error('usage: agentneo search <query>');
    return 1;
  }
  for (const c of searchCases(query)) printCase(c);
  return 0;
}

interface RunFlags {
  id: string | undefined;
  failed: boolean;
  updateSnapshots: boolean;
  confirm: boolean;
}

function applyRunArg(flags: RunFlags, arg: string): void {
  switch (arg) {
    case '--failed':
      flags.failed = true;
      return;
    case '--update-snapshots':
      flags.updateSnapshots = true;
      return;
    case '--confirm':
      flags.confirm = true;
      return;
    default:
      break;
  }
  if (arg.startsWith('--')) throw new Error(`unknown run flag: ${arg}`);
  if (flags.id !== undefined) throw new Error('usage: agentneo run [id-or-prefix] [--failed] [--update-snapshots --confirm]');
  flags.id = arg;
}

function parseRunArgs(rest: string[]): RunFlags {
  const flags: RunFlags = { id: undefined, failed: false, updateSnapshots: false, confirm: false };
  for (const arg of rest) applyRunArg(flags, arg);
  return flags;
}

function selectRunCases(flags: RunFlags, log: LastRunLog | null): NeoCase[] {
  if (flags.failed && flags.id !== undefined) {
    throw new Error('usage: agentneo run --failed takes no case id; drop the id or drop the flag.');
  }
  if (flags.failed) {
    if (!log) throw new Error(`no last-run log at ${LAST_RUN_FILE}; run the suite once before --failed.`);
    const ids = new Set(failedIds(log));
    return listCases().filter((c) => ids.has(c.id));
  }
  return flags.id ? matchCases(flags.id) : listCases();
}

function checkSnapshotGate(flags: RunFlags): void {
  if (flags.updateSnapshots && !flags.confirm) {
    throw new Error(
      'refusing to update snapshots without --confirm: baselines move only for genuine styling changes, ' +
        'after showing expected, actual, and diff to a human. Rerun with --update-snapshots --confirm as the machine record of that approval.',
    );
  }
}

function resolveRunPlan(rest: string[]): { flags: RunFlags; cases: NeoCase[] } {
  const flags = parseRunArgs(rest);
  checkSnapshotGate(flags);
  const log = readLastRun();
  const cases = selectRunCases(flags, log);
  if (cases.length === 0 && !flags.failed) throw new Error('no cases found');
  return { flags, cases: orderFailFirst(cases, log) };
}

// True when a case failed outside any spec (harness fault): the only
// failures with no FAIL line already printed, so the runner surfaces
// the error itself instead of exiting silent.
function harnessFault(result: RunResult): boolean {
  return !result.ok && !result.degraded && !result.specFailed;
}

async function runSelected(cases: NeoCase[], flags: RunFlags): Promise<number> {
  const entries: LastRunEntry[] = [];
  let degraded = false;
  let failed = false;
  for (const c of cases) {
    const started = Date.now();
    const result = await runCase(c, { updateSnapshots: flags.updateSnapshots });
    let status: 'ok' | 'failed' | 'degraded' = 'ok';
    if (result.degraded) {
      degraded = true;
      status = 'degraded';
    } else if (!result.ok) {
      failed = true;
      status = 'failed';
    }
    entries.push({ id: c.id, ok: result.ok, ms: Date.now() - started, status });
    for (const a of result.artifacts) console.log(`[${c.id}] artifact: ${a}`);
    if (harnessFault(result)) console.log(`[${c.id}] error: ${result.error}`);
  }
  const log = writeLastRun(entries, listCases().map((c) => c.id));
  console.log(`[neo] last-run log: ${log.cases.length} cases at ${LAST_RUN_FILE}`);
  if (failed) return 1;
  if (degraded) return 2;
  return 0;
}

async function cmdRun(rest: string[]): Promise<number> {
  let plan: { flags: RunFlags; cases: NeoCase[] };
  try {
    plan = resolveRunPlan(rest);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
  if (plan.cases.length === 0) {
    console.log('no failed cases in the last run; nothing to rerun.');
    return 0;
  }
  const types = await checkTypes();
  if (!types.ok) {
    console.log('[neo] typecheck failed: refusing to run with red types.');
    for (const line of types.lines) console.log(line);
    return 1;
  }
  return runSelected(plan.cases, plan.flags);
}

async function cmdStatus(): Promise<number> {
  const log = readLastRun();
  if (!log) {
    console.log(`no last-run log at ${LAST_RUN_FILE}; run the suite once first.`);
    return 1;
  }
  const folders = new Map(listCases().map((c) => [c.id, c.folder] as const));
  for (const g of summarizeByGroup(log, folders)) {
    console.log(`${g.group}: ${g.pass} pass, ${g.fail} fail, ${g.degraded} degraded`);
  }
  return 0;
}

async function cmdQuality(rest: string[]): Promise<number> {
  let mod: QualityGate;
  try {
    mod = (await import('../../tools/quality/run.ts')) as unknown as QualityGate;
  } catch (err) {
    const code = (err as { code?: string } | null | undefined)?.code;
    if (code === 'ERR_MODULE_NOT_FOUND') {
      console.error('quality gate not integrated yet: packages/reference-neo/tools/quality/run.ts is absent');
      return 3;
    }
    throw err;
  }
  if (typeof mod.runQuality !== 'function') {
    console.error('quality gate invalid: runQuality(argvArray) not exported');
    return 3;
  }
  return await mod.runQuality(rest);
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const [cmd, ...rest] = process.argv.slice(2);
let code = 0;
try {
  if (cmd === 'list') code = await cmdList();
  else if (cmd === 'search') code = await cmdSearch(rest[0]);
  else if (cmd === 'run') code = await cmdRun(rest);
  else if (cmd === 'status') code = await cmdStatus();
  else if (cmd === 'q') code = await cmdQuality(rest);
  else {
    console.error('usage: agentneo <list|search|run|status|q> [...]');
    code = 1;
  }
} catch (err) {
  console.error(messageOf(err));
  code = 1;
}
process.exit(code);
