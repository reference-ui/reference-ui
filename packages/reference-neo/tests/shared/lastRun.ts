// lastRun.ts — the last-run log backing --failed and fail-first ordering. Every executed run
// writes tests/.artifacts/last-run.json (gitignored) with a timestamp plus per-case { id, ok, ms, status? }.
// Partial reruns merge into the previous log so the file always describes the latest known state
// of every case it has ever seen. A missing or unreadable log is null, never a crash.
import fs from 'node:fs';
import path from 'node:path';
import { ARTIFACTS_DIR } from './cases.ts';

export interface LastRunEntry {
  id: string;
  ok: boolean;
  ms: number;
  status?: 'ok' | 'failed' | 'degraded';
}

export interface LastRunLog {
  timestamp: string;
  cases: LastRunEntry[];
}

export const LAST_RUN_FILE: string = path.join(ARTIFACTS_DIR, 'last-run.json');

function isEntry(value: unknown): value is LastRunEntry {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  const status = row.status;
  const statusOk = status === undefined || status === 'ok' || status === 'failed' || status === 'degraded';
  return typeof row.id === 'string' && typeof row.ok === 'boolean' && typeof row.ms === 'number' && statusOk;
}

// The last-run log, or null when no usable log exists (missing file, bad JSON, wrong shape).
export function readLastRun(): LastRunLog | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(LAST_RUN_FILE, 'utf8')) as unknown;
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const log = parsed as { timestamp?: unknown; cases?: unknown };
  if (typeof log.timestamp !== 'string' || !Array.isArray(log.cases)) return null;
  if (!log.cases.every(isEntry)) return null;
  return { timestamp: log.timestamp, cases: log.cases };
}

// Writes the log, merging fresh entries over the previous run so partial reruns keep the
// untouched cases. When pruneTo lists the known case ids, entries for deleted cases are
// dropped so stale ids never linger. Returns the log it wrote.
export function writeLastRun(entries: LastRunEntry[], pruneTo?: string[]): LastRunLog {
  const merged = new Map<string, LastRunEntry>();
  for (const row of readLastRun()?.cases ?? []) merged.set(row.id, row);
  for (const row of entries) merged.set(row.id, row);
  if (pruneTo) {
    const keep = new Set(pruneTo);
    for (const id of merged.keys()) if (!keep.has(id)) merged.delete(id);
  }
  const log: LastRunLog = { timestamp: new Date().toISOString(), cases: [...merged.values()] };
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.writeFileSync(LAST_RUN_FILE, `${JSON.stringify(log, null, 2)}\n`);
  return log;
}

// Ids recorded ok=false, in log order. Empty when there is no log or nothing failed.
export function failedIds(log: LastRunLog | null): string[] {
  return (log?.cases ?? []).filter((row) => !row.ok).map((row) => row.id);
}

// Fail-first ordering: cases that failed last run come first (in log order), everything else
// keeps its incoming relative order. Unknown ids sort with the passing tail.
export function orderFailFirst<T extends { id: string }>(cases: T[], log: LastRunLog | null): T[] {
  const failed = new Set(failedIds(log));
  const rank = (c: T): number => (failed.has(c.id) ? 0 : 1);
  return [...cases].sort((a, b) => rank(a) - rank(b));
}

export interface GroupStatus {
  group: string;
  pass: number;
  fail: number;
  degraded: number;
}

// Per-group pass/fail/degraded counts over the log. folders maps case id to
// its catalog folder (`css/NEO-CSS-01`); the group is the first segment, and
// ids with no known folder land under `unknown`. Sorted by group.
export function summarizeByGroup(log: LastRunLog, folders: Map<string, string>): GroupStatus[] {
  const groups = new Map<string, GroupStatus>();
  for (const row of log.cases) {
    const folder = folders.get(row.id) ?? '';
    const slash = folder.indexOf('/');
    const group = slash > 0 ? folder.slice(0, slash) : 'unknown';
    let status = groups.get(group);
    if (!status) {
      status = { group, pass: 0, fail: 0, degraded: 0 };
      groups.set(group, status);
    }
    if (row.status === 'degraded') status.degraded += 1;
    else if (row.ok) status.pass += 1;
    else status.fail += 1;
  }
  return [...groups.values()].sort((a, b) => (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));
}
