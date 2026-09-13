import fs from 'node:fs'
import zlib from 'node:zlib'
import type { Reporter, TestCase, TestResult, TestStatus } from '@playwright/test/reporter'

type Rgba = { r: number; g: number; b: number; a: number }
type DecodedPng = { width: number; height: number; data: Uint8Array }

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const CHANNEL_THRESHOLD = 8

function paethPredictor(a: number, b: number, c: number) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function readU32(buf: Buffer, offset: number) {
  return buf.readUInt32BE(offset)
}

/** Decode 8-bit non-interlaced RGB/RGBA/grayscale PNGs (Playwright screenshot output). */
export function decodePng(buf: Buffer): DecodedPng {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error('Not a PNG')
  }

  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idat: Buffer[] = []
  let offset = 8

  while (offset + 12 <= buf.length) {
    const length = readU32(buf, offset)
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii')
    const data = buf.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = readU32(data, 0)
      height = readU32(data, 4)
      bitDepth = data[8]
      colorType = data[9]
      const compression = data[10]
      const filterMethod = data[11]
      const interlace = data[12]
      if (bitDepth !== 8) throw new Error(`Unsupported PNG bit depth ${bitDepth}`)
      if (compression !== 0 || filterMethod !== 0) throw new Error('Unsupported PNG compression/filter method')
      if (interlace !== 0) throw new Error('Interlaced PNG is not supported')
      if (![0, 2, 4, 6].includes(colorType)) throw new Error(`Unsupported PNG color type ${colorType}`)
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }

  if (!width || !height) throw new Error('PNG missing IHDR')

  const bytesPerPixel = colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 4 ? 2 : 4
  const inflated = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * bytesPerPixel
  const raw = new Uint8Array(height * stride)
  let src = 0

  for (let y = 0; y < height; y++) {
    const filter = inflated[src++]
    const row = inflated.subarray(src, src + stride)
    src += stride
    const dest = y * stride
    const prev = y === 0 ? null : raw.subarray(dest - stride, dest)

    for (let i = 0; i < stride; i++) {
      const x = row[i]
      const a = i >= bytesPerPixel ? raw[dest + i - bytesPerPixel] : 0
      const b = prev ? prev[i] : 0
      const c = prev && i >= bytesPerPixel ? prev[i - bytesPerPixel] : 0
      let val = x
      if (filter === 1) val = (x + a) & 255
      else if (filter === 2) val = (x + b) & 255
      else if (filter === 3) val = (x + ((a + b) >> 1)) & 255
      else if (filter === 4) val = (x + paethPredictor(a, b, c)) & 255
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`)
      raw[dest + i] = val
    }
  }

  const data = new Uint8Array(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const srcI = i * bytesPerPixel
    const dstI = i * 4
    if (colorType === 0) {
      const g = raw[srcI]
      data[dstI] = g
      data[dstI + 1] = g
      data[dstI + 2] = g
      data[dstI + 3] = 255
    } else if (colorType === 2) {
      data[dstI] = raw[srcI]
      data[dstI + 1] = raw[srcI + 1]
      data[dstI + 2] = raw[srcI + 2]
      data[dstI + 3] = 255
    } else if (colorType === 4) {
      const g = raw[srcI]
      data[dstI] = g
      data[dstI + 1] = g
      data[dstI + 2] = g
      data[dstI + 3] = raw[srcI + 1]
    } else {
      data[dstI] = raw[srcI]
      data[dstI + 1] = raw[srcI + 1]
      data[dstI + 2] = raw[srcI + 2]
      data[dstI + 3] = raw[srcI + 3]
    }
  }

  return { width, height, data }
}

function pixelAt(img: DecodedPng, x: number, y: number): Rgba {
  const i = (y * img.width + x) * 4
  return { r: img.data[i], g: img.data[i + 1], b: img.data[i + 2], a: img.data[i + 3] }
}

function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b].map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')).join('')}`
}

function channelDeltaHex(expected: { r: number; g: number; b: number }, actual: { r: number; g: number; b: number }) {
  const dr = Math.round(actual.r - expected.r)
  const dg = Math.round(actual.g - expected.g)
  const db = Math.round(actual.b - expected.b)
  const mag = Math.abs(dr) + Math.abs(dg) + Math.abs(db)
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n))
  return { mag, label: `Δ rgb(${sign(dr)}, ${sign(dg)}, ${sign(db)})  manhattan ${mag}` }
}

export function analyzeSnapshotDrift(expectedBuf: Buffer, actualBuf: Buffer) {
  const expected = decodePng(expectedBuf)
  const actual = decodePng(actualBuf)
  if (expected.width !== actual.width || expected.height !== actual.height) {
    return {
      sizeMismatch: true as const,
      expectedSize: `${expected.width}×${expected.height}`,
      actualSize: `${actual.width}×${actual.height}`,
    }
  }

  const { width, height } = expected
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  let differ = 0
  let expR = 0
  let expG = 0
  let expB = 0
  let actR = 0
  let actG = 0
  let actB = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const e = pixelAt(expected, x, y)
      const a = pixelAt(actual, x, y)
      const dist = Math.abs(e.r - a.r) + Math.abs(e.g - a.g) + Math.abs(e.b - a.b)
      if (dist <= CHANNEL_THRESHOLD && Math.abs(e.a - a.a) <= CHANNEL_THRESHOLD) continue
      differ++
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      expR += e.r
      expG += e.g
      expB += e.b
      actR += a.r
      actG += a.g
      actB += a.b
    }
  }

  if (differ === 0) {
    return { sizeMismatch: false as const, identical: true as const, width, height }
  }

  const expectedMean = { r: expR / differ, g: expG / differ, b: expB / differ }
  const actualMean = { r: actR / differ, g: actG / differ, b: actB / differ }
  const delta = channelDeltaHex(expectedMean, actualMean)

  return {
    sizeMismatch: false as const,
    identical: false as const,
    width,
    height,
    differ,
    ratio: differ / (width * height),
    bbox: { minX, maxX, minY, maxY },
    expectedHex: toHex(expectedMean),
    actualHex: toHex(actualMean),
    delta,
  }
}

function readAttachment(attachment?: { path?: string; body?: Buffer | string }) {
  if (!attachment) return null
  if (attachment.path && fs.existsSync(attachment.path)) return fs.readFileSync(attachment.path)
  if (attachment.body) {
    return Buffer.isBuffer(attachment.body) ? attachment.body : Buffer.from(attachment.body)
  }
  return null
}

function snapshotLabel(pathName?: string, fallback = 'snapshot') {
  if (!pathName) return fallback
  const base = pathName.replace(/\\/g, '/').split('/').pop() || fallback
  return base.replace(/-(expected|actual|diff)(?=\.png$)/i, '')
}

function collectTriples(result: TestResult) {
  const expected = result.attachments.filter((a) => a.name === 'expected' || a.name.endsWith('-expected.png'))
  const actual = result.attachments.filter((a) => a.name === 'actual' || a.name.endsWith('-actual.png'))
  const diffs = result.attachments.filter((a) => a.name === 'diff' || a.name.endsWith('-diff.png'))
  const n = Math.max(expected.length, actual.length, diffs.length)
  const triples = []
  for (let i = 0; i < n; i++) {
    triples.push({
      expected: expected[i],
      actual: actual[i],
      diff: diffs[i],
    })
  }
  return triples
}

const FAILED: TestStatus[] = ['failed', 'timedOut']

export default class SnapshotTelemetryReporter implements Reporter {
  printsToStdio() {
    return false
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!FAILED.includes(result.status)) return
    const triples = collectTriples(result)
    if (triples.length === 0) return

    for (const triple of triples) {
      const expectedBuf = readAttachment(triple.expected)
      const actualBuf = readAttachment(triple.actual)
      const label = snapshotLabel(triple.actual?.path || triple.expected?.path || triple.diff?.path, test.title)

      console.log(`  🖼  Snapshot telemetry: ${label}`)
      if (triple.expected?.path) console.log(`     expected: ${triple.expected.path}`)
      if (triple.actual?.path) console.log(`     actual:   ${triple.actual.path}`)
      if (triple.diff?.path) console.log(`     diff:     ${triple.diff.path}`)

      if (!expectedBuf || !actualBuf) {
        console.log('     (could not read expected/actual PNG bytes for bbox analysis)')
        continue
      }

      try {
        const analysis = analyzeSnapshotDrift(expectedBuf, actualBuf)
        if (analysis.sizeMismatch) {
          console.log(`     size: expected ${analysis.expectedSize} vs actual ${analysis.actualSize}`)
          continue
        }
        if (analysis.identical) {
          console.log('     pixels: no channel delta above threshold (possible AA / compression noise)')
          continue
        }
        const { bbox, differ, ratio, expectedHex, actualHex, delta, width, height } = analysis
        console.log(`     bbox:  x: ${bbox.minX}..${bbox.maxX}  y: ${bbox.minY}..${bbox.maxY}`)
        console.log(`     pixels: ${differ} differ (${(ratio * 100).toFixed(2)}% of ${width}×${height})`)
        console.log(`     color: expected ${expectedHex} → actual ${actualHex}`)
        console.log(`     ${delta.label}`)
      } catch (err: any) {
        console.log(`     (telemetry parse failed: ${err?.message || err})`)
      }
    }
  }
}
