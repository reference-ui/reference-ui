// probe-snapshots.spec.ts — snapshot facility probes for NEO-PLAY-B-01.
// Takes { page, snap } from the runner with the page already navigated
// to the served world. Emits nothing on success; throws when the blessed
// baseline drifts, the pure compare misbehaves, or the name guard lets
// a hostile snapshot name through.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import type { SpecPage } from '../../../shared/page.ts';
import { compareSnapshots, type SnapFn } from '../../../shared/snapshots.ts';

interface SpecInput {
  page: SpecPage;
  snap: SnapFn;
}

interface PngImage {
  width: number;
  height: number;
  data: Buffer;
}

interface PngSync {
  write(png: PngImage): Buffer;
}

interface PngCtor {
  new (opts: { width: number; height: number }): PngImage;
  sync: PngSync;
}

const nodeRequire = createRequire(import.meta.url);
const PNG: PngCtor = (nodeRequire('pngjs') as { PNG: PngCtor }).PNG;

// Encodes a tiny solid PNG fixture of the given size and byte fill.
function solidPng(width: number, height: number, fill: number): Buffer {
  const png = new PNG({ width, height });
  png.data.fill(fill);
  return PNG.sync.write(png);
}

// Identical bytes pass with zero differing pixels.
function probeIdentical(): void {
  const first = solidPng(2, 2, 255);
  const second = solidPng(2, 2, 255);
  const diff = compareSnapshots(first, second);
  assert.equal(diff.passed, true, 'identical renders pass');
  assert.equal(diff.diffPixels, 0, `identical renders differ by 0, got ${diff.diffPixels}`);
}

// Fully recolored bytes fail loud with the full pixel count.
function probeMismatch(): void {
  const diff = compareSnapshots(solidPng(2, 2, 255), solidPng(2, 2, 0));
  assert.equal(diff.passed, false, 'recolored renders fail');
  assert.equal(diff.diffPixels, 4, `2x2 recolor differs by 4, got ${diff.diffPixels}`);
}

// Unequal rasters throw instead of comparing, since they cannot overlay.
function probeSizeDiff(): void {
  assert.throws(() => compareSnapshots(solidPng(2, 2, 255), solidPng(3, 3, 255)), /snapshot size differs/);
}

// Hostile names refuse before any screenshot is written.
async function probeBadName(page: SpecPage, snap: SnapFn): Promise<void> {
  await assert.rejects(snap(page, '../evil'), /snapshot name must match/);
}

export default async function run({ page, snap }: SpecInput): Promise<void> {
  probeIdentical();
  probeMismatch();
  probeSizeDiff();
  await probeBadName(page, snap);
  await snap(page, 'probes');
}
