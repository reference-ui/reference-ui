// runner.ts — headless spec executor for one neo case. Takes a case record
// from cases.ts plus an optional artifacts dir override. Emits
// { ok, degraded, artifacts, error? }: serves the world, runs every
// *.spec.ts headless, and collects screenshot/a11y/trace artifacts. When
// playwright is unresolvable it degrades to serve-only (degraded=true)
// instead of failing.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { startServer, type ServedWorld } from './server.ts';
import { ARTIFACTS_DIR, type NeoCase } from './cases.ts';
import type { SpecPage } from './page.ts';
import { makeSnap, type SnapFn } from './snapshots.ts';

export type { SpecPage } from './page.ts';

const require = createRequire(import.meta.url);

export interface RunOptions {
  artifactsDir?: string;
  updateSnapshots?: boolean;
}

export interface RunResult {
  ok: boolean;
  degraded: boolean;
  artifacts: string[];
  error?: string;
  specFailed?: boolean;
}

export interface SpecContext {
  page: SpecPage;
  url: string;
  case: NeoCase;
  snap: SnapFn;
}

interface BrowserContext {
  tracing: { start(opts: { screenshots: boolean; snapshots: boolean }): Promise<void>; stop(opts?: { path?: string }): Promise<void> };
  newPage(): Promise<SpecPage>;
  close(): Promise<void>;
}

interface Browser {
  newContext(): Promise<BrowserContext>;
  close(): Promise<void>;
}

interface ChromiumHost {
  chromium: { launch(): Promise<Browser> };
}

interface SpecModule {
  default?: unknown;
  run?: unknown;
}

type SpecFn = (ctx: SpecContext) => Promise<void>;

// Resolution check only. Never installs anything.
export function playwrightAvailable(): string | null {
  for (const name of ['playwright', 'playwright-core', '@playwright/test']) {
    try {
      require.resolve(name);
      return name;
    } catch {
      // try next
    }
  }
  return null;
}

function specFiles(specsDir: string): string[] {
  if (!fs.existsSync(specsDir)) return [];
  return fs
    .readdirSync(specsDir)
    .filter((f) => f.endsWith('.spec.ts'))
    .sort()
    .map((f) => path.join(specsDir, f));
}

// Browser launch isolated so runCase stays a flat pipeline: serve,
// resolve, launch, execute. Returns { browser } or { error }.
async function startBrowser(pkg: string): Promise<{ browser: Browser } | { error: unknown }> {
  try {
    const mod = (await import(pkg)) as unknown as ChromiumHost;
    return { browser: await mod.chromium.launch() };
  } catch (err) {
    return { error: err };
  }
}

// The sliver of a Playwright response the goto guard reads. SpecPage.goto
// returns unknown, so this narrows structurally; a null or foreign value
// means "no verdict", never a failure.
interface GotoResponse {
  ok(): boolean;
  status(): number;
}

function asGotoResponse(value: unknown): GotoResponse | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<GotoResponse>;
  if (typeof candidate.ok !== 'function' || typeof candidate.status !== 'function') return null;
  return candidate as GotoResponse;
}

// Navigates to the served world and fails loud when the server answers
// anything but 200, so a broken world reads as a harness fault with the
// status code, never a spec timeout downstream.
async function loadWorld(page: SpecPage, world: ServedWorld): Promise<void> {
  const landed = asGotoResponse(await page.goto(world.url, { waitUntil: 'load' }));
  if (landed && !landed.ok()) {
    throw new Error(`world failed to load: HTTP ${landed.status()} at ${world.url} — the world needs an index.html`);
  }
}

// Executes every spec against the served world. A failing spec ends
// the run with ok=false (never throws); only harness faults throw.
async function executeSpecs(page: SpecPage, world: ServedWorld, c: NeoCase, snap: SnapFn): Promise<{ ok: boolean; failure: unknown; specFailed: boolean }> {
  const specs = specFiles(c.specsDir);
  if (specs.length === 0) {
    return { ok: false, failure: new Error(`no specs in ${c.specsDir}`), specFailed: false };
  }
  for (const spec of specs) {
    const mod = (await import(pathToFileURL(spec).href)) as unknown as SpecModule;
    const candidate: unknown = mod.default ?? mod.run;
    if (typeof candidate !== 'function') throw new Error(`${spec} must default-export an async run function`);
    await loadWorld(page, world);
    try {
      await (candidate as SpecFn)({ page, url: world.url, case: c, snap });
      console.log(`[${c.id}] PASS ${path.basename(spec)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[${c.id}] FAIL ${path.basename(spec)}: ${message}`);
      return { ok: false, failure: err, specFailed: true };
    }
  }
  return { ok: true, failure: null, specFailed: false };
}

// Screenshot plus accessibility snapshot on every browser run; trace
// only on failure. Returns the artifact paths it wrote. Each artifact
// is best-effort: a broken collector warns loud but never flips a
// passing run — the verdict comes from spec assertions, never evidence.
async function dumpArtifacts(page: SpecPage, context: BrowserContext, dir: string, ok: boolean): Promise<string[]> {
  const tag = path.basename(dir);
  const written: string[] = [];
  const shot = path.join(dir, 'screenshot.png');
  try {
    await page.screenshot({ path: shot });
    written.push(shot);
  } catch (err) {
    console.log(`[${tag}] artifact warning: screenshot failed: ${messageOf(err)}`);
  }
  try {
    const yaml = await page.locator('body').ariaSnapshot();
    const a11y = path.join(dir, 'a11y.yml');
    fs.writeFileSync(a11y, yaml.endsWith('\n') ? yaml : `${yaml}\n`);
    written.push(a11y);
  } catch (err) {
    console.log(`[${tag}] artifact warning: accessibility snapshot failed: ${messageOf(err)}`);
  }
  try {
    if (!ok) {
      const trace = path.join(dir, 'trace.zip');
      await context.tracing.stop({ path: trace });
      written.push(trace);
    } else {
      await context.tracing.stop();
    }
  } catch (err) {
    console.log(`[${tag}] artifact warning: tracing stop failed: ${messageOf(err)}`);
  }
  return written;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? (err.message ?? String(err)) : String(err);
}

// One GET against the served world root: 200 means an index.html answered,
// any other status (or no response at all) means the world is empty or
// broken. Null is "no response", never confused with a status code.
function preflightRoot(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (value: number | null): void => {
      if (!done) {
        done = true;
        resolve(value);
      }
    };
    const req = http.get(url, (res) => {
      res.resume();
      finish(res.statusCode ?? null);
    });
    req.on('error', () => finish(null));
    req.setTimeout(5000, () => {
      req.destroy();
      finish(null);
    });
  });
}

// Serves the world and preflights its index before any browser launches,
// so an empty or missing world fails loud and fast instead of timing out
// inside a spec. Either fault arrives as { error }, never a throw: the
// caller returns it down the normal failure path with artifacts and log.
async function serveWorld(c: NeoCase): Promise<{ world: ServedWorld } | { error: string }> {
  let world: ServedWorld;
  try {
    world = await startServer(c.worldDir);
  } catch (err) {
    return { error: `world failed to serve: ${messageOf(err)}` };
  }
  const probe = await preflightRoot(world.url);
  if (probe !== 200) {
    await world.stop().catch(() => {});
    const detail = probe === null ? 'no response' : `HTTP ${probe}`;
    return { error: `world failed to load (${detail}) at ${world.url} — the world needs an index.html` };
  }
  return { world };
}

interface BrowserRun {
  browser: Browser;
  world: ServedWorld;
  c: NeoCase;
  dir: string;
  artifacts: string[];
  snap: SnapFn;
}

// Owns one browser lifetime for a case: context, specs, artifacts.
// Harness faults become ok=false; spec faults arrive via executeSpecs.
async function runWithBrowser({ browser, world, c, dir, artifacts, snap }: BrowserRun): Promise<RunResult> {
  let outcome: { ok: boolean; failure: unknown; specFailed: boolean };
  try {
    const context = await browser.newContext();
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const result = await executeSpecs(page, world, c, snap);
    artifacts.push(...(await dumpArtifacts(page, context, dir, result.ok)));
    await context.close();
    outcome = result;
  } catch (err) {
    outcome = { ok: false, failure: err, specFailed: false };
  } finally {
    await browser.close().catch(() => {});
  }
  const { ok, failure, specFailed } = outcome;
  const error = failure === null || failure === undefined ? undefined : messageOf(failure);
  return { ok, degraded: false, artifacts, error, specFailed };
}

// Runs one case: serve its world, execute each spec headless, dump
// artifacts. Returns { ok, degraded, artifacts, error? }.
// degraded=true means Playwright/browsers were not resolvable: the world
// was served but no spec executed (serve-only mode). Never throws for a
// spec failure; that is ok=false.
export async function runCase(c: NeoCase, { artifactsDir = ARTIFACTS_DIR, updateSnapshots = false }: RunOptions = {}): Promise<RunResult> {
  const dir = path.join(artifactsDir, c.id);
  fs.mkdirSync(dir, { recursive: true });
  const artifacts: string[] = [];

  const served = await serveWorld(c);
  if ('error' in served) {
    return { ok: false, degraded: false, artifacts, error: served.error, specFailed: false };
  }
  const world = served.world;
  const stop = (): Promise<void> => world.stop().catch(() => {});

  const pkg = playwrightAvailable();
  if (!pkg) {
    console.log(`[${c.id}] playwright not resolvable (serve-only mode): world served at ${world.url}, no spec executed.`);
    await stop();
    return { ok: false, degraded: true, artifacts, error: 'playwright not resolvable' };
  }

  const started = await startBrowser(pkg);
  if ('error' in started) {
    const detail = started.error instanceof Error ? (started.error.message?.split('\n')[0] ?? started.error) : started.error;
    console.log(`[${c.id}] browser launch failed (serve-only mode): ${detail}`);
    await stop();
    const message = started.error instanceof Error ? started.error.message : String(started.error);
    return { ok: false, degraded: true, artifacts, error: `browser launch failed: ${message}` };
  }

  const snap = makeSnap({ c, artifactsDir: dir, updateSnapshots });
  const outcome = await runWithBrowser({ browser: started.browser, world, c, dir, artifacts, snap });
  await stop();
  return { ...outcome, degraded: false };
}
