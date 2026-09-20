/**
 * Known-invalid CSS in committed atomic goldens. Defect entries are compiler
 * or fixture bugs with an owner; that half of the list may only shrink. The
 * standing CSS gauge uses it so the suite can go green before the defects are
 * fixed. A meta-test asserts that no entry now validates, so fixing a bug
 * without emptying its slot fails the build. Do not "fix"
 * BaseSystem::lib_fixture() or the token passthrough policy from here —
 * passthrough is deferred (testing.md §5 step 8). Intentional parity pins
 * (absurd authoring both engines reproduce textually, each citing its v2
 * test) are permanent and never defects.
 */
export const CSS_QUARANTINE: Record<string, readonly string[]> = {
  // Wrong shorthand expansions.
  'ATM-LEAF-04': ['border-color: 0'],
  'ATM-LEAF-08': ['border-color: 0'],
  'ATM-NAME-05': ['box-shadow: 3px solid'],
  'ATM-RHYTHM-04': ['background-position: 10px auto'],

  // Token-passthrough policy. Deferred, testing.md §5 step 8.
  'ATM-DIAG-04': ['Unexpected input', 'caret-color: ui.missing.path'],
  'ATM-DIAG-13': ['Unexpected input', 'background: ui.missing.path'],
  'ATM-SHORT-03': ['Unexpected input', 'border: borders.card'],
  'ATM-TOKEN-02': ['margin-top: blue .600'],
  'ATM-TOKEN-05': ['background: blue .600'],
  'ATM-TOKEN-06': ['border-color: /40', 'color: red .500/'],
  'ATM-TOKEN-14': ['Unexpected input', 'caret-color: ui.missing.path'],
  'ATM-VALID-03': ['Unexpected input', 'color: ghost.white'],

  // §11 silent bare-value passthrough (intended, permanent): a bare miss
  // passes its authored text through for the browser to drop, so the sheet
  // holds declarations the lexer rejects. Forge Slice 1, ATM-TOKEN-16.
  'ATM-TOKEN-16': ['font-size: sm', 'color: md'],

  // Intentional parity pin: `&(:focus)` substitutes textually to
  // `.<cls>(:focus)` (v2 `nested_selector_parity.rs:532` prints the same
  // shape). The author wrote an invalid selector; both engines keep it.
  'ATM-COND-27': ['Identifier is expected'],

  // Non-ASCII probe input (diagnostics station, not a content-emit pin):
  // the author wrote an unquoted `content` string to place the emoji ahead
  // of the refused identifier; the verbatim string policy keeps it as-is
  // (cf. ATM-LEAF-10, where the author includes their own quotes).
  'ATM-DIAG-06': ['content: 😀'],
}

export function quarantineFor(stationId: string): readonly string[] {
  return CSS_QUARANTINE[stationId] ?? []
}
