#!/usr/bin/env node
// neo — the Neo host CLI for case worlds and consumer projects.
// It takes a verb plus an optional project dir and emits a fresh generated
// folder or removes one. Sync runs the world's own sync() and prints its
// cost in ms; sync --watch stays resident and resyncs on every matched
// add/change/unlink until SIGINT. Clean removes the generated folder plus
// the scope links sync made. Anything else prints usage; failures name the
// cause and exit nonzero.
import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getOutDirPath } from '../src/lib/paths/out-dir.ts';
import { removeGeneratedLink } from '../src/lib/symlink/index.ts';
import { getShortName } from '../src/packager/layout.ts';
import { PACKAGES } from '../src/packager/packages.ts';

const LINKED_PACKAGES = PACKAGES.map((pkg) => getShortName(pkg.name));
const USAGE = 'usage: neo <sync|clean> [dir]\n       neo sync --watch [dir]';

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function cmdSync(dir: string): Promise<number> {
  try {
    const { sync } = await import('../src/sync/index.ts');
    const started = Date.now();
    const result = await sync(dir);
    // One-shot completeness (the Obj-1 deferred bin/ scope): sync() schedules
    // the session-owned tasty phase on the background loop, which a process
    // that exits never runs — so drain it here. Without this, types.mjs keeps
    // its ./tasty/runtime.js edge while types/tasty/ never lands, and any
    // bundler resolving @reference-ui/types fails (lib tsup red since REF-10).
    const { flushReferenceBuild } = await import('../src/reference/bridge/init.ts');
    const build = await flushReferenceBuild(dir);
    if (build?.status === 'failed') {
      console.log(`[neo] sync failed: reference tasty build failed: ${build.message}`);
      return 1;
    }
    console.log(`[neo] sync ${Date.now() - started}ms → ${result.outDir}`);
    return 0;
  } catch (err) {
    console.log(`[neo] sync failed: ${messageOf(err)}`);
    return 1;
  }
}

function removeScopeLinks(dir: string, outDir: string): number {
  let removed = 0;
  for (const name of LINKED_PACKAGES) {
    const linkPath = join(dir, 'node_modules', '@reference-ui', name);
    if (removeGeneratedLink(linkPath, outDir)) {
      removed += 1;
    }
  }
  return removed;
}

function cmdClean(dir: string): number {
  const outDir = getOutDirPath(dir);
  const hadFolder = existsSync(outDir);
  rmSync(outDir, { recursive: true, force: true });
  const links = removeScopeLinks(dir, outDir);
  if (!hadFolder && links === 0) {
    console.log(`[neo] clean: nothing to remove at ${outDir}`);
    return 0;
  }
  console.log(`[neo] clean removed ${outDir} (${links} links)`);
  return 0;
}

function printHelp(argv: string[]): number | null {
  const verb = argv[0];
  if (verb === '--help' || verb === '-h') {
    console.log(USAGE);
    return 0;
  }
  return null;
}

function usageError(detail: string): number {
  console.log(`${USAGE}\n${detail}`);
  return 1;
}

async function cmdWatch(dir: string): Promise<number> {
  try {
    const { watchSync } = await import('../src/sync/watch.ts');
    const started = Date.now();
    const handle = await watchSync(dir, {
      onChange: (change) => console.log(`[neo] ${change.event} ${change.relativePath}`),
      onResync: (result) => console.log(`[neo] resync → ${result.outDir}`),
      onError: (err) => console.log(`[neo] watch error: ${messageOf(err)}`),
    });
    console.log(`[neo] sync ${Date.now() - started}ms → ${dir}/.reference-ui`);
    console.log(`[neo] watching ${dir} — Ctrl-C to stop`);
    const shutdown = (): void => {
      void handle.stop().then(
        () => process.exit(0),
        () => process.exit(1),
      );
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    await new Promise<void>(() => {});
    return 0;
  } catch (err) {
    console.log(`[neo] watch failed: ${messageOf(err)}`);
    return 1;
  }
}

async function routeCommand(verb: string, watch: boolean, dir: string): Promise<number> {
  if (verb === 'sync') return watch ? cmdWatch(dir) : cmdSync(dir);
  return cmdClean(dir);
}

function isVerb(verb: string | undefined): verb is 'sync' | 'clean' {
  return verb === 'sync' || verb === 'clean';
}

async function main(argv: string[]): Promise<number> {
  const help = printHelp(argv);
  if (help !== null) return help;
  const [verb, ...rest] = argv;
  if (!isVerb(verb)) return usageError(`unknown command: ${verb ?? '(none)'}`);
  const watch = rest.includes('--watch');
  const positional = rest.filter((arg) => arg !== '--watch');
  if (positional.length > 1) return usageError(`unexpected argument: ${positional[1]}`);
  if (watch && verb !== 'sync') return usageError('clean takes no --watch');
  return routeCommand(verb, watch, resolve(positional[0] ?? process.cwd()));
}

const code = await main(process.argv.slice(2));
process.exit(code);
