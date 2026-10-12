/**
 * Pins the contact-sheet builder's pure rules without a browser: sample
 * timing, grid geometry, byte ranges, signature deltas, and which stills are
 * chosen from a recording (including skipping blank load/unmount frames).
 * Run with: node --test .agents/skills/test-component/scripts/cases/videoContactSheet.test.mjs
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  computeGridFrameRects,
  meanSignatureDelta,
  resolveByteRange,
  sampleTimestamps,
  selectActiveFrameTimestamps,
  signatureSpread,
} from '../videoContactSheet.mjs'

const BLANK = 10
const LIT = 200
const blankSignature = (size = 4) => new Array(size).fill(BLANK)
const litSignature = (size = 4) => new Array(size).fill(LIT)

function sample(t, signature) {
  return { t, signature }
}

test('sampleTimestamps starts at zero, ends at the duration, and stays ascending', () => {
  const timestamps = sampleTimestamps(2, { stepSeconds: 0.1 })
  assert.equal(timestamps.length, 21)
  assert.equal(timestamps[0], 0)
  assert.equal(timestamps[timestamps.length - 1], 2)
  for (let index = 1; index < timestamps.length; index += 1) {
    assert.ok(timestamps[index] > timestamps[index - 1])
  }
})

test('sampleTimestamps widens the step to respect the sample cap', () => {
  const timestamps = sampleTimestamps(100, { stepSeconds: 0.1, maxSamples: 300 })
  assert.equal(timestamps.length, 300)
  assert.equal(timestamps[0], 0)
  assert.equal(timestamps[timestamps.length - 1], 100)
})

test('sampleTimestamps rejects unusable durations, steps, and caps', () => {
  for (const duration of [0, -1, Number.NaN, Infinity, -Infinity, null, undefined, '5']) {
    assert.throws(() => sampleTimestamps(duration), /positive finite duration/, String(duration))
  }
  for (const stepSeconds of [0, -1, Number.NaN, Infinity, null, '0.1']) {
    assert.throws(() => sampleTimestamps(5, { stepSeconds }), /positive finite step/, String(stepSeconds))
  }
  for (const maxSamples of [1, 0, -1, 1.5, Number.NaN, null, '300']) {
    assert.throws(() => sampleTimestamps(5, { maxSamples }), /sample cap/, String(maxSamples))
  }
})

test('meanSignatureDelta averages the absolute per-pixel difference', () => {
  assert.equal(meanSignatureDelta([1, 2, 3], [1, 2, 3]), 0)
  assert.equal(meanSignatureDelta([0, 0, 0], [2, 4, 6]), 4)
  assert.throws(() => meanSignatureDelta([1, 2], [1]), /equal-length/)
  assert.throws(() => meanSignatureDelta([], []), /non-empty and equal-length/)
  assert.throws(() => meanSignatureDelta(null, [1]), /two signature arrays/)
})

test('selectActiveFrameTimestamps ignores an all-identical recording', () => {
  const samples = [0, 0.5, 1, 1.5, 2].map((t) => sample(t, blankSignature()))
  assert.deepEqual(selectActiveFrameTimestamps(samples, { threshold: 4 }), [])
})

test('selectActiveFrameTimestamps picks frames inside a blank-burst-blank sequence', () => {
  const samples = [
    sample(0.0, blankSignature()),
    sample(0.5, blankSignature()),
    sample(1.0, litSignature()),
    sample(1.1, litSignature()),
    sample(1.2, litSignature()),
    sample(1.5, blankSignature()),
    sample(2.0, blankSignature()),
  ]
  const chosen = selectActiveFrameTimestamps(samples, { threshold: 4 })
  assert.ok(chosen.length > 0)
  for (const t of chosen) {
    assert.ok(t >= 1.0 && t <= 1.2, `timestamp ${t} should sit inside the burst`)
  }
  assert.equal(chosen[0], 1.0)
  assert.equal(chosen[chosen.length - 1], 1.2)
})

test('selectActiveFrameTimestamps keeps change points and thins more than eight', () => {
  // Every step brightens by 20, so each sample is a change point against the
  // previously kept still and the twelve candidates must be thinned to eight.
  const samples = [sample(0, blankSignature())]
  for (let index = 1; index <= 12; index += 1) {
    const value = BLANK + index * 20
    samples.push(sample(index, new Array(4).fill(value)))
  }
  const chosen = selectActiveFrameTimestamps(samples, { frameCount: 8, threshold: 4 })
  assert.equal(chosen.length, 8)
  assert.equal(chosen[0], 1)
  assert.equal(chosen[chosen.length - 1], 12)
  for (let index = 1; index < chosen.length; index += 1) {
    assert.ok(chosen[index] > chosen[index - 1])
  }
})

test('selectActiveFrameTimestamps rejects unusable inputs', () => {
  assert.throws(() => selectActiveFrameTimestamps('nope'), /array of samples/)
  assert.throws(() => selectActiveFrameTimestamps([], { frameCount: 0 }), /positive integer frame count/)
  assert.throws(() => selectActiveFrameTimestamps([], { threshold: -1 }), /non-negative threshold/)
})

test('computeGridFrameRects lays out a 4x2 grid for eight frames', () => {
  const geometry = computeGridFrameRects({ frameCount: 8, columns: 4, cellWidth: 320, cellHeight: 200, gap: 6 })
  assert.equal(geometry.columns, 4)
  assert.equal(geometry.rows, 2)
  assert.equal(geometry.rects.length, 8)
  assert.equal(geometry.gridWidth, 4 * 320 + 3 * 6)
  assert.equal(geometry.gridHeight, 2 * 200 + 1 * 6)

  assert.deepEqual(geometry.rects[0], { index: 0, column: 0, row: 0, x: 0, y: 0, width: 320, height: 200 })
  assert.deepEqual(geometry.rects[3], { index: 3, column: 3, row: 0, x: 3 * 326, y: 0, width: 320, height: 200 })
  assert.deepEqual(geometry.rects[4], { index: 4, column: 0, row: 1, x: 0, y: 206, width: 320, height: 200 })
})

test('computeGridFrameRects rounds rows up for a partial last row', () => {
  const geometry = computeGridFrameRects({ frameCount: 7, columns: 4 })
  assert.equal(geometry.rows, 2)
  assert.equal(geometry.rects.length, 7)
  assert.equal(geometry.rects[6].row, 1)
  assert.equal(geometry.rects[6].column, 2)
})

test('computeGridFrameRects rejects unusable frame and column counts', () => {
  for (const frameCount of [0, -1, 1.5, Number.NaN, null, '8']) {
    assert.throws(() => computeGridFrameRects({ frameCount }), /positive integer frame count/, String(frameCount))
  }
  for (const columns of [0, -1, 1.5, Number.NaN, null, '4']) {
    assert.throws(() => computeGridFrameRects({ frameCount: 8, columns }), /positive integer column count/, String(columns))
  }
})

test('resolveByteRange serves the full body without a range header', () => {
  assert.equal(resolveByteRange(undefined, 100), null)
  assert.equal(resolveByteRange('', 100), null)
  assert.equal(resolveByteRange('bytes=', 100), null)
})

test('resolveByteRange returns inclusive start and end for open ranges', () => {
  assert.deepEqual(resolveByteRange('bytes=0-', 100), { start: 0, end: 99 })
  assert.deepEqual(resolveByteRange('bytes=10-49', 100), { start: 10, end: 49 })
  assert.deepEqual(resolveByteRange('bytes=90-200', 100), { start: 90, end: 99 })
  assert.deepEqual(resolveByteRange('bytes=-30', 100), { start: 70, end: 99 })
})

test('resolveByteRange flags unsatisfiable ranges', () => {
  assert.deepEqual(resolveByteRange('bytes=100-200', 100), { unsatisfiable: true })
  assert.deepEqual(resolveByteRange('bytes=80-40', 100), { unsatisfiable: true })
  assert.deepEqual(resolveByteRange('bytes=-0', 100), { unsatisfiable: true })
})

test('resolveByteRange rejects an unusable byte length', () => {
  for (const total of [0, -1, 1.5, Number.NaN, null, '100']) {
    assert.throws(() => resolveByteRange('bytes=0-', total), /positive integer byte length/, String(total))
  }
})

test('selectActiveFrameTimestamps skips flat blank frames around the component', () => {
  const component = [10, 200, 10, 200]
  const samples = [
    sample(0, blankSignature()),
    sample(0.1, new Array(4).fill(60)), // flat flash while the page loads
    sample(0.2, component),
    sample(0.3, [10, 220, 10, 220]),
    sample(0.4, new Array(4).fill(40)), // flat frame after unmount
  ]
  assert.deepEqual(selectActiveFrameTimestamps(samples, { threshold: 4 }), [0.2, 0.3])
})

test('signatureSpread is zero for a flat frame and positive for content', () => {
  assert.equal(signatureSpread(blankSignature()), 0)
  assert.equal(signatureSpread([10, 200, 10]), 190)
})
