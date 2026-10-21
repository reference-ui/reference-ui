/**
 * Pinned evidence for the enterprise harvest census: the sink census, the pool triple, the net-new
 * and gross counts, the backchannel histogram, and the byte cells the fixture compile must reproduce.
 * The census test compares its measured numbers against these exports and never edits them. Byte
 * cells move with each landing that changes emitted bytes; these exports are the current
 * pins.
 */

export type SinkRow = [prop: string, when: string[], kind: string, minted: number]

/** Expected sink census, `(prop, when)` sorted: the evidence numbers, pinned. */
export const EXPECTED_SINKS: SinkRow[] = [
  ['backgroundColor', [], 'color', 7],
  ['backgroundImage', [], 'url', 11],
  ['bg', [], 'color', 15],
  ['borderBottomColor', [], 'color', 7],
  ['borderColor', [], 'color', 6],
  ['color', [], 'color', 5],
  ['color', ['_hover'], 'color', 7],
  ['display', [], 'keyword', 5],
  ['fill', [], 'color', 8],
  ['fontSize', [], 'length', 171],
  ['height', [], 'length', 172],
  ['margin', [], 'length', 173],
  ['marginBlock', [], 'length', 172],
  ['marginBottom', [], 'length', 175],
  ['marginInline', [], 'length', 174],
  ['marginLeft', [], 'length', 174],
  ['marginRight', [], 'length', 175],
  ['marginTop', [], 'length', 175],
  ['maxWidth', [], 'length', 172],
  ['minWidth', [], 'length', 172],
  ['outlineColor', [], 'color', 7],
  ['padding', [], 'length', 168],
  ['paddingBlock', [], 'length', 173],
  ['paddingBottom', [], 'length', 173],
  ['paddingInline', [], 'length', 173],
  ['paddingLeft', [], 'length', 173],
  ['paddingRight', [], 'length', 173],
  ['paddingTop', [], 'length', 173],
  ['stroke', [], 'color', 8],
  ['transform', [], 'transform', 10],
  ['width', [], 'length', 171],
  ['width', ['md'], 'length', 176],
]

export const EXPECTED_NET_NEW = 3554
export const EXPECTED_POOL = { color: 149, keyword: 7, length: 170, math: 0, transform: 6, url: 8 }
export const EXPECTED_GROSS = 3615

/** Expected `(|P-L|, |P∩L|, |P|)` by kind: the D1 bound, pinned. */
export const EXPECTED_TRIPLE: Record<string, [number, number, number]> = {
  color: [75, 74, 149],
  keyword: [3, 4, 7],
  length: [119, 51, 170],
  math: [0, 0, 0],
  transform: [4, 2, 6],
  url: [6, 2, 8],
}

/** Expected byte cells, re-pinned at each byte-moving landing. */
export const EXPECTED_BYTES = {
  // styles.css cells.
  cssRaw: 241240,
  cssGzip: 28472,
  cssBrotli: 15592,
  stylePlans: 3689,
  harvestWants: EXPECTED_NET_NEW,
  // react.mjs cells and the derived counts.
  reactRaw: 153378,
  reactGzip: 37822,
  fixtureRules: 3693,
  m500Rules: 32916,
}

/**
 * Expected backchannel histogram: 135 static-leaf lookups, 33 dynamic sites
 * (32 holes + the gap control), 33 dynamic warnings, but only 32 sink infos
 * — the gap site warns yet never sinks (record-time filter).
 */
export const EXPECTED_COMPILER_CODES: [string, number][] = [
  ['ATM-I-EXPECTED-LOOKUP', 135],
  ['ATM-I-DYNAMIC-SLOT', 33],
  ['ATM-W-DYNAMIC-IDENTIFIER', 33],
  ['ATM-I-HARVEST-SINK', 32],
]
