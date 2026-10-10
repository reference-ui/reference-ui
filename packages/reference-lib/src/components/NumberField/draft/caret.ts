/**
 * The logical caret model (NF-EDIT-07): formatting replacements preserve
 * the caret by logical digit, not by offset. isLogicalDigitChar names the
 * digit class — ASCII plus the active numbering-system glyphs, the same
 * class the parser accepts — and offsetAfterLogicalDigits maps a
 * preceding-digit count into the new text, clamping to the end when the
 * new text cannot satisfy the count. Pure, proven by its colocated suite.
 */

// Logical caret digit (NF-EDIT-07): ASCII plus the active numbering-system
// glyphs — the same digit class the parser accepts. Hanidec/foreign digits
// never render here, so they count as separators, never caret anchors.
export function isLogicalDigitChar(char: string, digits: string): boolean {
  if (char >= '0' && char <= '9') return true
  return digits.includes(char)
}

// Caret offset after the count-th logical digit of text (NF-EDIT-07): the
// caret follows its digits across formatting replacements. A caret with no
// preceding digit anchors to text start; a count the new text cannot
// satisfy clamps to the end (documented end fallback).
export function offsetAfterLogicalDigits(text: string, count: number, digits: string): number {
  if (count <= 0) return 0
  let seen = 0
  let offset = 0
  for (const char of Array.from(text)) {
    offset += char.length
    if (isLogicalDigitChar(char, digits)) {
      seen += 1
      if (seen === count) return offset
    }
  }
  return text.length
}
