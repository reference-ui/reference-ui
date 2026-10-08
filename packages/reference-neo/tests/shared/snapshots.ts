// snapshots.ts — settled-state screenshot compare with human-gated baselines. Specs call the
// snap(page, name) closure the runner hands them: it screenshots, compares against the committed
// baseline in tests/cases/<id>/__snapshots__/<name>.png, and throws on mismatch with the diff path
// plus the mismatch size in plain pixels and percent. Baselines are written only in update mode,
// which the CLI arms solely with --update-snapshots plus --confirm; there is no silent write path.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import type { NeoCase } from './cases.ts';

// Per-pixel color distance below which two pixels still match (pixelmatch scale 0-1). At 0.1,
// identical renders match while genuinely restyled pixels fail; subpixel anti-aliasing jitter
// around text edges stays silent.
export const SNAPSHOT_PIXEL_THRESHOLD = 0.1;
// Fraction of all pixels allowed to differ before the snapshot fails. 0.001 (0.1%) forgives a
// few stray pixels on large viewports; moved, added, removed, or strongly recolored elements
// dwarf it and fail loudly. Known blind spot: the per-pixel threshold above forgives small
// color distances everywhere at once, so a subtle full-surface tone shift can still pass —
// every pass logs its drift so near-misses stay visible instead of silent.
export const SNAPSHOT_MAX_DIFF_RATIO = 0.001;

const SNAPSHOT_DIRNAME = '__snapshots__';
const SNAPSHOT_NAME = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

// The only page surface snapshots need, so specs pass whatever page object they hold.
export interface SnapPage {
  screenshot(opts: { path: string }): Promise<unknown>;
}

export type SnapFn = (page: SnapPage, name: string) => Promise<void>;

export interface SnapOptions {
  c: NeoCase;
  artifactsDir: string;
  updateSnapshots: boolean;
}

interface PngImage {
  width: number;
  height: number;
  data: Buffer;
}

interface PngSync {
  read(buf: Buffer): PngImage;
  write(png: PngImage): Buffer;
}

interface PngCtor {
  new (opts: { width: number; height: number }): PngImage;
  sync: PngSync;
}

const nodeRequire = createRequire(import.meta.url);
const PNG: PngCtor = (nodeRequire('pngjs') as { PNG: PngCtor }).PNG;

export interface SnapshotDiff {
  width: number;
  height: number;
  diffPixels: number;
  total: number;
  ratio: number;
  passed: boolean;
  diffPng: Buffer;
}

// Pure pixel compare over two PNG buffers. Throws when the bytes do not decode or the sizes
// differ, since pixelmatch needs two equally sized rasters; the snap closure turns those into
// artifact-carrying errors, and probes call this directly with generated fixtures.
export function compareSnapshots(baseline: Buffer, actual: Buffer): SnapshotDiff {
  const base = PNG.sync.read(baseline);
  const curr = PNG.sync.read(actual);
  if (base.width !== curr.width || base.height !== curr.height) {
    throw new Error(`snapshot size differs: baseline ${base.width}x${base.height} vs actual ${curr.width}x${curr.height}`);
  }
  const diff = new PNG({ width: base.width, height: base.height });
  const diffPixels = pixelmatch(base.data, curr.data, diff.data, base.width, base.height, {
    threshold: SNAPSHOT_PIXEL_THRESHOLD,
  });
  const total = base.width * base.height;
  const ratio = total === 0 ? 0 : diffPixels / total;
  return { width: base.width, height: base.height, diffPixels, total, ratio, passed: ratio <= SNAPSHOT_MAX_DIFF_RATIO, diffPng: PNG.sync.write(diff) };
}

export function snapshotDir(c: NeoCase): string {
  return path.join(c.dir, SNAPSHOT_DIRNAME);
}

function checkName(name: string): void {
  if (!SNAPSHOT_NAME.test(name)) {
    throw new Error(`snapshot name must match ${String(SNAPSHOT_NAME)} (letters, digits, _ and -), got ${JSON.stringify(name)}`);
  }
}

function describeMismatch(diff: SnapshotDiff): string {
  const pct = (diff.ratio * 100).toFixed(2);
  const plural = diff.diffPixels === 1 ? 'pixel' : 'pixels';
  return `${diff.diffPixels} of ${diff.total} ${plural} (${pct}%) differ`;
}

// Builds the snap closure for one case run. Update mode copies the fresh screenshot over the
// baseline and returns; compare mode deletes the scratch actual on match and throws with the
// actual/diff artifact paths on mismatch. The actual PNG always survives a failure for inspection.
export function makeSnap({ c, artifactsDir, updateSnapshots }: SnapOptions): SnapFn {
  return async (page: SnapPage, name: string): Promise<void> => {
    checkName(name);
    const baselinePath = path.join(snapshotDir(c), `${name}.png`);
    const actualPath = path.join(artifactsDir, `${name}.actual.png`);
    const diffPath = path.join(artifactsDir, `${name}.diff.png`);
    await page.screenshot({ path: actualPath });
    const actual = fs.readFileSync(actualPath);
    if (updateSnapshots) {
      fs.mkdirSync(snapshotDir(c), { recursive: true });
      fs.writeFileSync(baselinePath, actual);
      fs.rmSync(actualPath, { force: true });
      console.log(`[${c.id}] snapshot updated: ${baselinePath}`);
      return;
    }
    if (!fs.existsSync(baselinePath)) {
      throw new Error(
        `snapshot "${name}" has no baseline at ${baselinePath}; the actual render is kept at ${actualPath}. ` +
          `Show expected, actual, and diff to a human, then rerun with --update-snapshots --confirm to bless it.`,
      );
    }
    let diff: SnapshotDiff;
    try {
      diff = compareSnapshots(fs.readFileSync(baselinePath), actual);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`snapshot "${name}" failed: ${detail}; see actual ${actualPath} (no diff: the images cannot be overlaid).`);
    }
    if (!diff.passed) {
      fs.writeFileSync(diffPath, diff.diffPng);
      throw new Error(`snapshot "${name}" differs from baseline: ${describeMismatch(diff)}; see actual ${actualPath} and diff ${diffPath}.`);
    }
    fs.rmSync(actualPath, { force: true });
    console.log(`[${c.id}] snapshot "${name}": ${describeMismatch(diff)} (pass)`);
  };
}
