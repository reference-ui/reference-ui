/**
 * Exact shortest-tie breaks for decimal rendering (L4 companion).
 * V8's shortest spelling breaks exact ties to the even last digit while
 * Rust's `Display` breaks them away from zero (larger magnitude); both
 * spellings round-trip, so the mirror needs the oracle's choice, not the
 * closest one. Takes the value plus its V8-shortest plain spelling and
 * returns what Rust emits: the input unless a same-length last-digit
 * neighbor parses back and sits exactly opposite across the exact binary
 * value (BigInt-proven equidistance), in which case the larger magnitude
 * wins. Anything but a plain decimal spelling passes through untouched.
 */

/** Last significant digits that can close an exact tie pair (`{2,3}`, `{7,8}`). */
const TIE_DIGITS = new Set(['2', '3', '7', '8'])

/**
 * Break one shortest-tie the oracle way. The input keeps its spelling
 * unless it won an exact tie V8 breaks even: then the larger magnitude
 * (Rust's choice) wins. Non-plain spellings are not numbers to break.
 */
export function breakShortestTie(value: number, plain: string): string {
  if (!isPlainDecimal(plain)) return plain
  const last = lastSignificantDigit(plain)
  if (last === undefined || !TIE_DIGITS.has(last)) return plain
  for (const partner of tiePartners(plain)) {
    if (Number(partner) === value && isExactTie(value, plain, partner)) {
      return largerMagnitude(plain, partner)
    }
  }
  return plain
}

/** True for optional `-` plus digits with at most one dot and a digit somewhere. */
function isPlainDecimal(spelling: string): boolean {
  let index = spelling.startsWith('-') ? 1 : 0
  let digits = 0
  let dots = 0
  while (index < spelling.length) {
    const code = spelling.charCodeAt(index)
    if (code >= 0x30 && code <= 0x39) digits += 1
    else if (code === 0x2e) dots += 1
    else return false
    index += 1
  }
  return digits > 0 && dots <= 1
}

/** Last significant digit: sign, dot, and surrounding zeros stripped. */
function lastSignificantDigit(spelling: string): string | undefined {
  const parts = spellingParts(spelling)
  const sig = parts.digits.replace(/0+$/, '')
  return sig.length === 0 ? undefined : sig[sig.length - 1]
}

/** One plain spelling as sign, leading-zero-free digits, and point. */
interface SpellingParts {
  neg: boolean
  digits: string
  point: number
}

/** Split sign and dot; the point counts from the stripped digits. */
function spellingParts(spelling: string): SpellingParts {
  const neg = spelling.startsWith('-')
  const text = neg ? spelling.slice(1) : spelling
  const dot = text.indexOf('.')
  const raw = dot < 0 ? text : text.slice(0, dot) + text.slice(dot + 1)
  const point = dot < 0 ? text.length : dot
  let lead = 0
  while (lead < raw.length && raw[lead] === '0') lead += 1
  return { neg, digits: raw.slice(lead) || '0', point: point - lead }
}

/** Same-length neighbors: significant digits plus/minus one, point kept. */
function tiePartners(plain: string): string[] {
  const parts = spellingParts(plain)
  const sig = parts.digits.replace(/0+$/, '') || '0'
  const trail = parts.digits.length - sig.length
  const out: string[] = []
  for (const delta of [1n, -1n]) {
    const next = BigInt(sig) + delta
    if (next <= 0n) continue
    const text = next.toString()
    if (text.length !== sig.length || text.startsWith('0')) continue
    out.push(renderPartner(parts.neg, text + '0'.repeat(trail), parts.point))
  }
  return out
}

/** Plain spelling from sign, full digits, and the kept point. */
function renderPartner(neg: boolean, digits: string, point: number): string {
  let plain: string
  if (point <= 0) plain = '0.' + '0'.repeat(-point) + digits
  else if (point >= digits.length) plain = digits + '0'.repeat(point - digits.length)
  else plain = digits.slice(0, point) + '.' + digits.slice(point)
  return neg ? '-' + plain : plain
}

/** Exact binary value: mantissa times two to the exponent, plus sign. */
interface ExactParts {
  mant: bigint
  exp: number
  neg: boolean
}

/** Bit-exact mantissa and exponent through a big-endian view. */
function exactParts(value: number): ExactParts {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value, false)
  const bits = view.getBigUint64(0, false)
  const biased = Number((bits >> 52n) & 0x7ffn)
  let mant = bits & ((1n << 52n) - 1n)
  let exp: number
  if (biased === 0) {
    exp = -1074
  } else {
    exp = biased - 1075
    mant |= 1n << 52n
  }
  return { mant, exp, neg: bits >> 63n === 1n }
}

/** True when the exact value sits exactly midway between two spellings. */
function isExactTie(value: number, first: string, second: string): boolean {
  const exact = exactParts(value)
  const left = spellingParts(first)
  const right = spellingParts(second)
  const shiftLeft = left.point - left.digits.length
  const shiftRight = right.point - right.digits.length
  const shiftMin = Math.min(shiftLeft, shiftRight, 0)
  const expMin = Math.min(exact.exp, 0)
  const scaledExact =
    (exact.neg ? -exact.mant : exact.mant) *
    pow2(exact.exp - expMin) *
    pow10(-shiftMin)
  const scaledLeft =
    (left.neg ? -BigInt(left.digits) : BigInt(left.digits)) *
    pow10(shiftLeft - shiftMin) *
    pow2(-expMin)
  const scaledRight =
    (right.neg ? -BigInt(right.digits) : BigInt(right.digits)) *
    pow10(shiftRight - shiftMin) *
    pow2(-expMin)
  return 2n * scaledExact === scaledLeft + scaledRight
}

/** Integer powers; exponents stay near a thousand on this path. */
function pow10(exp: number): bigint {
  let out = 1n
  for (let index = 0; index < exp; index += 1) out *= 10n
  return out
}

/** Integer powers of two for the binary side of the tie equation. */
function pow2(exp: number): bigint {
  let out = 1n
  for (let index = 0; index < exp; index += 1) out *= 2n
  return out
}

/** Larger magnitude of two same-scale spellings, by significant digits. */
function largerMagnitude(first: string, second: string): string {
  const left = BigInt(spellingParts(first).digits)
  const right = BigInt(spellingParts(second).digits)
  return right > left ? second : first
}
