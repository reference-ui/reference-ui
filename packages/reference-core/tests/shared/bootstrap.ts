// bootstrap.ts — self-bootstrapping prerequisites for agentcore run. It takes nothing and runs, in order,
// the reference-component mirror when its gitignored output is missing, the native addon build through
// the agent-rs ensure-native command (which holds the rs:build queue lock), and the core dist freshness gate.
// The gate runs with its skip variable cleared so a stale dist is never used, and the first failing step
// stops the run and names itself, so a fresh clone reports the step that broke instead of a typecheck wall.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const CORE_DIR: string = path.dirname(path.dirname(HERE));
const REPO_DIR: string = path.dirname(path.dirname(CORE_DIR));
const MIRROR_OUTPUT: string = path.join(CORE_DIR, 'src', 'reference', 'browser-component');
const MIRROR_TOOL: string = path.join(CORE_DIR, 'tools', 'mirror-reference-component.mjs');
const DIST_GATE: string = path.join(CORE_DIR, 'tools', 'ensure-dist.mjs');
const AGENT_RS: string = path.join(REPO_DIR, '.agents', 'skills', 'agent-rs', 'scripts', 'run.mjs');
// The dist gate treats an empty value as unset, so clearing the opt-out keeps its freshness check live.
const DIST_SKIP_VARIABLE = 'REF_PIPELINE_SKIP_DEPENDENCY_BUILDS';

export type BootstrapResult = { ok: true } | { ok: false; message: string };

function mirrorMissing(): boolean {
  return !existsSync(MIRROR_OUTPUT) || readdirSync(MIRROR_OUTPUT).length === 0;
}

function runStep(label: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): BootstrapResult {
  console.log(`[core] bootstrap: ${label}`);
  const result = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit' });
  if (result.error) return { ok: false, message: `${label} could not start: ${result.error.message}` };
  if (result.status !== 0) return { ok: false, message: `${label} failed (exit ${result.status ?? 'by signal'})` };
  return { ok: true };
}

/** Brings a checkout to a runnable state; once everything is current it costs only the gate stats. */
export function bootstrapCore(): BootstrapResult {
  const env: NodeJS.ProcessEnv = { ...process.env, [DIST_SKIP_VARIABLE]: '' };
  if (mirrorMissing()) {
    const mirror = runStep('reference component mirror', [MIRROR_TOOL], CORE_DIR, env);
    if (!mirror.ok) return mirror;
  }
  const native = runStep('native addon', [AGENT_RS, 'ensure-native'], REPO_DIR, env);
  if (!native.ok) return native;
  return runStep('core dist', [DIST_GATE], CORE_DIR, env);
}
