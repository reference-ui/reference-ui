#!/usr/bin/env node

/**
 * Renders agent-readable stills from Playwright CT recordings.
 *
 * Playwright writes one webm per CT run, but no agent host here can play video,
 * so this module densifies each recording into a small grid of stills named
 * `frames.png` beside the source video. It does not show an even spread: CT clips
 * are mostly the blank gallery loading and the fixture unmounting, so even stills
 * miss the interaction. Instead it seeks a fixed 16 evenly spaced points (a seek
 * costs far more than a decode, so the cost no longer grows with clip length),
 * signatures each frame as a 32x20 luminance array, and keeps the frames where
 * the picture changed (`selectActiveFrameTimestamps`), labelled with their
 * timestamps. When nothing changes it still writes a loud banner so a blank
 * recording is obvious. The runner builds sheets for failed tests by default.
 *
 * `writeVideoContactSheets` launches exactly ONE headless Chromium (resolved from
 * packages/reference-lib), serves each video over a fake HTTP origin so canvas
 * pixels stay untainted, and reports `noChange` per video. The pure helpers are
 * exported separately and unit-tested without a browser; the page.evaluate bodies
 * live in videoContactSheetBrowser.mjs.
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { prepareVideo, renderContactSheet, sampleSignatures } from './videoContactSheetBrowser.mjs'

const PLAYWRIGHT_PACKAGE = '@playwright/test'
const FAKE_ORIGIN = 'https://reference-ui-frames.invalid'
const VIDEO_ROUTE = `${FAKE_ORIGIN}/video.webm`
const ROUTE_PATTERN = `${FAKE_ORIGIN}/**`
const MAX_FRAME_COUNT = 8
const GRID_COLUMNS = 4
const CELL_WIDTH = 320
const CELL_HEIGHT = 200
const CELL_GAP = 6
const LABEL_HEIGHT = 26
const DURATION_TIMEOUT_MS = 20000
const SEEK_TIMEOUT_MS = 20000
const SAMPLE_COUNT = 16
const SIGNATURE_WIDTH = 32
const SIGNATURE_HEIGHT = 20

/**
 * Mean absolute luminance difference (0-255 scale) at or above which a sample is
 * treated as "active" (changed from the first frame) and as a change point
 * against the previously kept still. Measured on real Button CT clips, static
 * blank frames sit at exactly 0.00 (the webm encoder only emits changed blocks),
 * while even a small, dim component moves the whole-frame mean to >=1.74. 1.0
 * sits just above the blank floor and just below the faintest real content, so
 * blank frames are ignored without losing a visible component.
 */
const ACTIVE_MEAN_DELTA = 1
/**
 * Minimum luminance spread (max minus min, 0-255) for a frame to count as
 * showing content. A blank page between load and mount, or after unmount, is
 * one flat colour (spread 0); any rendered component has edges and text.
 * Without this, the first and last "active" stills were often blank
 * transitions rather than the component.
 */
const MIN_CONTENT_SPREAD = 8
const NO_CHANGE_BANNER = 'no change from first frame - recording may be blank'
const PAGE_HTML =
  '<!doctype html><html><head><meta charset="utf-8"><title>reference-ui contact sheet</title></head><body></body></html>'

/**
 * Parses a single HTTP `Range: bytes=...` header against a known byte length and
 * returns inclusive `{ start, end }`. Returns `null` when there is no usable
 * range (serve the whole body) and `{ unsatisfiable: true }` for a 416. Chromium
 * refuses to seek a routed video unless the route answers range requests, so
 * this is what makes frame sampling possible.
 */
export function resolveByteRange(rangeHeader, totalBytes) {
  if (typeof rangeHeader !== 'string' || rangeHeader.trim() === '') return null
  if (!Number.isInteger(totalBytes) || totalBytes <= 0) {
    throw new Error(`resolveByteRange needs a positive integer byte length, received ${totalBytes}`)
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())
  if (!match || (match[1] === '' && match[2] === '')) return null
  let start
  let end
  if (match[1] === '') {
    const suffixLength = Number(match[2])
    if (suffixLength <= 0) return { unsatisfiable: true }
    start = Math.max(0, totalBytes - suffixLength)
    end = totalBytes - 1
  } else {
    start = Number(match[1])
    end = match[2] === '' ? totalBytes - 1 : Number(match[2])
  }
  if (end >= totalBytes) end = totalBytes - 1
  if (start > end || start >= totalBytes) return { unsatisfiable: true }
  return { start, end }
}

/**
 * Lays out `frameCount` cells left-to-right, then top-to-bottom, and reports the
 * full grid size. Pure geometry: no canvas or DOM touched.
 */
export function computeGridFrameRects({
  frameCount = MAX_FRAME_COUNT,
  columns = GRID_COLUMNS,
  cellWidth = CELL_WIDTH,
  cellHeight = CELL_HEIGHT,
  gap = CELL_GAP,
} = {}) {
  if (!Number.isInteger(frameCount) || frameCount < 1) {
    throw new Error(`computeGridFrameRects needs a positive integer frame count, received ${frameCount}`)
  }
  if (!Number.isInteger(columns) || columns < 1) {
    throw new Error(`computeGridFrameRects needs a positive integer column count, received ${columns}`)
  }
  const rows = Math.ceil(frameCount / columns)
  const rects = []
  for (let index = 0; index < frameCount; index += 1) {
    const column = index % columns
    const row = Math.floor(index / columns)
    rects.push({
      index,
      column,
      row,
      x: column * (cellWidth + gap),
      y: row * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
    })
  }
  return {
    columns,
    rows,
    cellWidth,
    cellHeight,
    gap,
    gridWidth: columns * cellWidth + (columns - 1) * gap,
    gridHeight: rows * cellHeight + (rows - 1) * gap,
    rects,
  }
}

/**
 * Chooses density-scan timestamps: `count` evenly spaced points from 0 to the
 * duration, so a clip costs the same number of seeks however long it runs. The
 * first sample is always 0 and the last is the duration, so the detector sees
 * the whole recording.
 */
export function sampleTimestamps(durationSeconds, { count = SAMPLE_COUNT } = {}) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error(`sampleTimestamps needs a positive finite duration, received ${durationSeconds}`)
  }
  if (!Number.isInteger(count) || count < 2) {
    throw new Error(`sampleTimestamps needs an integer sample count of at least two, received ${count}`)
  }
  const step = durationSeconds / (count - 1)
  const timestamps = []
  for (let index = 0; index < count; index += 1) {
    timestamps.push(index === count - 1 ? durationSeconds : index * step)
  }
  return timestamps
}

/**
 * Mean absolute difference between two equal-length luminance signatures, on the
 * 0-255 scale. Throws loudly on mismatched or empty arrays so a caller can never
 * compare unlike frames.
 */
export function meanSignatureDelta(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new Error('meanSignatureDelta needs two signature arrays')
  }
  if (a.length === 0 || a.length !== b.length) {
    throw new Error(`signatures must be non-empty and equal-length (received ${a.length} and ${b.length})`)
  }
  let total = 0
  for (let index = 0; index < a.length; index += 1) total += Math.abs(a[index] - b[index])
  return total / a.length
}

/** Luminance spread of one signature: 0 for a flat, blank frame. */
export function signatureSpread(signature) {
  let lowest = Infinity
  let highest = -Infinity
  for (const value of signature) {
    if (value < lowest) lowest = value
    if (value > highest) highest = value
  }
  return highest - lowest
}

/**
 * Picks the stills worth showing from `[{ t, signature }]` and returns their
 * timestamps ascending. A sample is "active" when it differs from the FIRST
 * sample by more than `threshold` and is not a flat blank frame (see
 * MIN_CONTENT_SPREAD); the chosen set is the change points among the
 * active samples (a sample that differs from the previously kept still by more
 * than `threshold`), always including the first and last active sample. More than
 * `frameCount` change points are thinned evenly. Returns `[]` when nothing
 * differs from the first frame — the caller then renders the no-change banner.
 */
export function selectActiveFrameTimestamps(samples, { frameCount = MAX_FRAME_COUNT, threshold = ACTIVE_MEAN_DELTA } = {}) {
  if (!Array.isArray(samples)) {
    throw new Error(`selectActiveFrameTimestamps needs an array of samples, received ${typeof samples}`)
  }
  if (!Number.isInteger(frameCount) || frameCount < 1) {
    throw new Error(`selectActiveFrameTimestamps needs a positive integer frame count, received ${frameCount}`)
  }
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new Error(`selectActiveFrameTimestamps needs a non-negative threshold, received ${threshold}`)
  }
  if (samples.length === 0) return []

  const reference = samples[0].signature
  const changed = samples.filter((sample) => meanSignatureDelta(sample.signature, reference) > threshold)
  if (changed.length === 0) return []
  // Prefer frames that show content; fall back to every changed frame when the
  // whole recording is flat colour (a full-page colour change is still a change).
  const withContent = changed.filter((sample) => signatureSpread(sample.signature) >= MIN_CONTENT_SPREAD)
  const active = withContent.length > 0 ? withContent : changed

  const changePoints = [active[0]]
  let lastKept = active[0].signature
  for (let index = 1; index < active.length; index += 1) {
    const sample = active[index]
    if (meanSignatureDelta(sample.signature, lastKept) > threshold) {
      changePoints.push(sample)
      lastKept = sample.signature
    }
  }
  const lastActive = active[active.length - 1]
  if (changePoints[changePoints.length - 1] !== lastActive) changePoints.push(lastActive)

  const chosen = changePoints.length > frameCount ? thinEvenly(changePoints, frameCount) : changePoints
  return chosen.map((sample) => sample.t)
}

function thinEvenly(items, count) {
  if (count <= 1) return [items[0]]
  const chosen = []
  const lastIndex = items.length - 1
  for (let index = 0; index < count; index += 1) {
    const item = items[Math.round((index * lastIndex) / (count - 1))]
    if (chosen[chosen.length - 1] !== item) chosen.push(item)
  }
  return chosen
}

/**
 * Builds the `route.fulfill` payload for a video request: 200 for the full body,
 * 206 with `Content-Range` for a valid range, or 416 when the range cannot be met.
 * Byte-range support is what lets Chromium seek the routed recording.
 */
function buildVideoResponse(videoBytes, rangeHeader) {
  const totalBytes = videoBytes.length
  const baseHeaders = { 'accept-ranges': 'bytes', 'content-type': 'video/webm', 'cache-control': 'no-store' }
  const range = resolveByteRange(rangeHeader, totalBytes)
  if (!range) {
    return { status: 200, headers: { ...baseHeaders, 'content-length': String(totalBytes) }, body: videoBytes }
  }
  if (range.unsatisfiable) {
    return { status: 416, headers: { 'content-range': `bytes */${totalBytes}` }, body: Buffer.alloc(0) }
  }
  const chunk = videoBytes.subarray(range.start, range.end + 1)
  return {
    status: 206,
    headers: {
      ...baseHeaders,
      'content-range': `bytes ${range.start}-${range.end}/${totalBytes}`,
      'content-length': String(chunk.length),
    },
    body: chunk,
  }
}

function findRepoRoot(startDir = path.dirname(fileURLToPath(import.meta.url))) {
  let current = startDir
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) return current
    current = path.dirname(current)
  }
  throw new Error(`Cannot locate repository root (pnpm-workspace.yaml) above ${startDir}`)
}

function loadPlaywright() {
  const libPackageJson = path.join(findRepoRoot(), 'packages', 'reference-lib', 'package.json')
  if (!fs.existsSync(libPackageJson)) {
    throw new Error(`Cannot resolve ${PLAYWRIGHT_PACKAGE}: missing ${libPackageJson}`)
  }
  let playwright
  try {
    playwright = createRequire(libPackageJson)(PLAYWRIGHT_PACKAGE)
  } catch (err) {
    throw new Error(`Cannot load ${PLAYWRIGHT_PACKAGE} from packages/reference-lib: ${err.message}`, { cause: err })
  }
  if (!playwright || !playwright.chromium) {
    throw new Error(`${PLAYWRIGHT_PACKAGE} did not expose chromium`)
  }
  return playwright
}

/**
 * Launches one headless Chromium and writes a `frames.png` contact sheet beside
 * each video. Returns `[{ videoPath, framesPath, noChange }]`. Throws an error
 * naming the video when a sheet cannot be produced, and always closes the browser.
 */
export async function writeVideoContactSheets(videoPaths) {
  const videos = (videoPaths || []).filter((entry) => typeof entry === 'string' && entry.length > 0)
  if (videos.length === 0) return []

  const { chromium } = loadPlaywright()
  const browser = await chromium.launch({ headless: true })
  const results = []
  try {
    const page = await browser.newPage()
    try {
      for (const videoPath of videos) {
        results.push(await writeContactSheetForVideo(page, videoPath))
      }
    } finally {
      await page.close()
    }
  } finally {
    await browser.close()
  }
  return results
}

async function writeContactSheetForVideo(page, videoPath) {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Cannot build contact sheet: video does not exist: ${videoPath}`)
  }
  const framesPath = path.join(path.dirname(videoPath), 'frames.png')
  const videoBytes = fs.readFileSync(videoPath)

  const routeHandler = async (route) => {
    if (route.request().url() === VIDEO_ROUTE) {
      await route.fulfill(buildVideoResponse(videoBytes, route.request().headers()['range']))
    } else {
      await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: PAGE_HTML })
    }
  }

  await page.route(ROUTE_PATTERN, routeHandler)
  try {
    await page.goto(`${FAKE_ORIGIN}/`, { waitUntil: 'load' })
    const duration = await page.evaluate(prepareVideo, { assetUrl: VIDEO_ROUTE, timeoutMs: DURATION_TIMEOUT_MS })
    const probeTimes = sampleTimestamps(duration)
    const samples = await page.evaluate(sampleSignatures, {
      timestamps: probeTimes,
      signatureWidth: SIGNATURE_WIDTH,
      signatureHeight: SIGNATURE_HEIGHT,
      seekTimeoutMs: SEEK_TIMEOUT_MS,
    })
    const timestamps = selectActiveFrameTimestamps(samples)
    const noChange = timestamps.length === 0
    const frameCount = Math.max(1, timestamps.length)
    const geometry = computeGridFrameRects({ frameCount, columns: Math.min(GRID_COLUMNS, frameCount) })
    await page.evaluate(renderContactSheet, {
      timestamps,
      geometry,
      labelHeight: LABEL_HEIGHT,
      seekTimeoutMs: SEEK_TIMEOUT_MS,
      banner: noChange ? NO_CHANGE_BANNER : null,
    })
    await page.locator('#reference-ui-frames').screenshot({ path: framesPath })
    return { videoPath, framesPath, noChange }
  } catch (err) {
    throw new Error(`Failed to build contact sheet for video "${videoPath}": ${err.message}`, { cause: err })
  } finally {
    await page.unroute(ROUTE_PATTERN, routeHandler)
  }
}
