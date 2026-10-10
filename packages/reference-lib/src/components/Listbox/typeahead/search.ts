/**
 * Listbox's typeahead search kernel: the buffer advance shared by the
 * standalone (live-DOM) and virtual (logical-item) paths, plus the two
 * wrapping match orders. A repeat character — or an empty buffer when the
 * current item already starts with the key — cycles to the next match
 * (LB-KEY-04); any other key extends the buffer and searches from the
 * current item. Pure — the typeahead hook owns the buffer timer and focus
 * effects, and this module only answers "what is the query, and where is
 * the match".
 */

export function isRepeatTypeaheadChar(
  buffer: string,
  char: string,
  collator: Intl.Collator
): boolean {
  return (
    char.length === 1 &&
    buffer.length > 0 &&
    buffer.split('').every(c => collator.compare(c, char) === 0)
  )
}

export function typeaheadStartsWith(
  text: string,
  query: string,
  collator: Intl.Collator
): boolean {
  return (
    text.length >= query.length &&
    collator.compare(text.slice(0, query.length), query) === 0
  )
}

export interface AdvancedTypeaheadQuery {
  query: string
  cycling: boolean
}

export function advanceTypeaheadQuery(
  buffer: string,
  char: string,
  currentText: string,
  collator: Intl.Collator
): AdvancedTypeaheadQuery {
  const cycling =
    isRepeatTypeaheadChar(buffer, char, collator) ||
    (buffer.length === 0 &&
      currentText.length > 0 &&
      collator.compare(currentText.slice(0, char.length), char) === 0)
  return cycling ? { query: char, cycling: true } : { query: buffer + char, cycling: false }
}

export function findTypeaheadMatchAfter(
  texts: readonly string[],
  query: string,
  afterPos: number,
  collator: Intl.Collator
): number {
  for (let i = afterPos + 1; i < texts.length; i += 1) {
    if (typeaheadStartsWith(texts[i], query, collator)) return i
  }
  for (let i = 0; i <= afterPos && i < texts.length; i += 1) {
    if (typeaheadStartsWith(texts[i], query, collator)) return i
  }
  return -1
}

export function findTypeaheadMatchFrom(
  texts: readonly string[],
  query: string,
  fromPos: number,
  collator: Intl.Collator
): number {
  for (let i = fromPos; i < texts.length; i += 1) {
    if (typeaheadStartsWith(texts[i], query, collator)) return i
  }
  for (let i = 0; i < fromPos && i < texts.length; i += 1) {
    if (typeaheadStartsWith(texts[i], query, collator)) return i
  }
  return -1
}
