// Neo diagnostic codes: the owned mirror of the native code template.
// It takes wire code text and emits validated identities plus the one-line
// fix hints the verbose list prints. Shape is enforced here at parse time;
// the registry document stays the deliberate gate for new namespaces.
/** Namespace owned by the diagnostics template itself; mirrors Rust. */
export const TEMPLATE_NAMESPACE = 'RS'

/**
 * Machine-readable copy of the REGISTRY.md namespace table; mirrors Rust.
 * Advisory only: parsing stays shape-open so newer codes keep reading.
 */
export const REGISTERED_NAMESPACES: readonly string[] = [
  'RS',
  'ATM',
  'ATL',
  'TST',
  'STT',
  'TGN',
  'CAN',
  'BSS',
  'VRS',
  'MGP',
]

const CODE_PATTERN = /^([A-Z][A-Z0-9]{1,3})-([WE])-([A-Z0-9]+(?:-[A-Z0-9]+)*)$/
const MAX_CODE_LENGTH = 64

/** A code or diagnostic payload that failed template validation. */
export class DiagnosticParseError extends Error {
  override name = 'DiagnosticParseError'
}

/** Parse and validate a wire code; anything off-shape throws with the reason. */
export function parseCode(input: unknown): string {
  if (typeof input !== 'string') throw new DiagnosticParseError('diagnostic code must be a string')
  if (input.length > MAX_CODE_LENGTH) {
    throw new DiagnosticParseError('diagnostic code exceeds 64 characters')
  }
  if (input.split('-')[1] === 'I') {
    throw new DiagnosticParseError(
      'severity tag `I` is reserved; the template carries warnings and errors only'
    )
  }
  if (!CODE_PATTERN.test(input)) {
    throw new DiagnosticParseError(`invalid diagnostic code: ${input}`)
  }
  return input
}

/** Namespace segment of a validated code, e.g. `ATM`. */
export function codeNamespace(code: string): string {
  return code.split('-')[0] ?? code
}

/** Severity tag a code was minted with: `W` or `E`. */
export function codeSeverityTag(code: string): 'W' | 'E' {
  return code.split('-')[1] === 'E' ? 'E' : 'W'
}

/** Whether the code was minted as a warning (`-W-`). */
export function isWarningCode(code: string): boolean {
  return codeSeverityTag(code) === 'W'
}

/** Whether the code was minted as an error (`-E-`). */
export function isErrorCode(code: string): boolean {
  return codeSeverityTag(code) === 'E'
}

/** Advisory check against the registry table; unregistered codes still parse. */
export function isRegisteredNamespace(code: string): boolean {
  return REGISTERED_NAMESPACES.includes(codeNamespace(code))
}

// One-line fix hints by stable warning code. Warnings only: infos are
// compiler telemetry with no author action, and errors throw unchanged.
// Codes missing here print without a hint — never a guessed one.
const WARNING_HINTS: Record<string, string> = {
  'ATM-W-DYNAMIC-EXPRESSION': 'hoist the expression into a static literal or variant',
  'ATM-W-DYNAMIC-MEMBER': 'replace the member lookup with a literal value',
  'ATM-W-DYNAMIC-IDENTIFIER': 'replace the identifier with a literal or token',
  'ATM-W-MUTATED-BINDING': 'stop reassigning the binding before the style call',
  'ATM-W-DYNAMIC-TEMPLATE': 'use a static string instead of the template',
  'ATM-W-DYNAMIC-UNARY': 'fold the unary expression to a literal',
  'ATM-W-DYNAMIC-BINARY': 'fold the binary expression to a literal',
  'ATM-W-UNFOLDABLE-KEY': 'use a static key instead of the computed key',
  'ATM-W-UNKNOWN-PROPERTY': 'remove it or check the property spelling',
  'ATM-W-UNKNOWN-BREAKPOINT': 'use a breakpoint from the theme',
  'ATM-W-NON-OBJECT-CONDITION': 'give the condition key a style object',
  'ATM-W-UNFOLDABLE-SPREAD': 'inline the spread or keep only static props',
  'ATM-W-UNKNOWN-CONDITION': 'use a condition from the theme',
  'ATM-W-MISSING-CONTAINER-ROOT': 'add a container root for the @container atom',
  'ATM-W-NON-CANONICAL-NUMERIC': 'use a plain decimal number',
  'ATM-W-INVALID-CSS-VALUE': 'use a CSS keyword, token, or value the prop accepts',
  'ATM-W-MALFORMED-OPACITY': 'write the opacity modifier as /<0-100>',
  'ATM-W-UNKNOWN-TOKEN-PATH': 'point the path at an existing token',
  'ATM-W-TOKEN-CATEGORY-MISMATCH': 'use a token from the matching category',
  'ATM-W-UNKNOWN-COLOR': 'use a color token or a CSS color',
  'ATM-W-UNTERMINATED-BRACE': 'close the { brace in the value',
  'ATM-W-STATIC-WILDCARD': 'use a concrete value; this prop has no token category',
  'ATM-W-EMPTY-AT-RULE': 'fill in the at-rule query or drop the key',
  'ATM-W-UNSUPPORTED-GLOBAL-VALUE': 'use a single value under the conditional key',
  'ATM-W-TRACE-SKIPPED': 'check the StyleTrace host graph for the skipped file',
  'ATM-W-NON-OBJECT-CSS-ARG': 'pass a static style object to css()',
  'ATM-W-NON-OBJECT-JSX-STYLE': 'pass a static style object to the style prop',
  'ATM-W-RESPONSIVE-ARRAY-SPREAD': 'remove the spread from the value array',
  'ATM-W-TAGGED-TEMPLATE-SITE': 'call css() with an object instead of a template',
  'ATM-W-UNFOLDABLE-OBJECT-PROP': 'give the const-object prop a static value',
  'ATM-W-PARTIAL-OBJECT-PROP': 'make the dynamic arm static or drop the prop',
  'ATM-W-TOKEN-CALL-REFUSED': 'use a supported token() shape',
  'ATM-W-MISSING-STYLE-PLAN': 'make the lookup static so the plan can serve it',
  'ATM-W-RESPONSIVE-LEAF-IMPORTANT': 'drop the ! marker; per-leaf important is refused',
  'ATM-W-UNREALIZABLE-EXTENSION': 'drop the prop; the dialect has no served css form',
  'TST-W-PARSE-ERROR': 'fix the syntax error so the file parses cleanly',
  'TST-W-DUPLICATE-DECLARATION': 'merge the duplicate declarations or rename one',
  'TST-W-DUPLICATE-MEMBER': 'remove the duplicate member or rename one',
  'TST-W-STAR-AMBIGUITY': 're-export the name explicitly from the barrel',
  'TST-W-DUPLICATE-SYMBOL-NAME': 'use the symbol id or a scoped lookup to disambiguate',
  'ATL-W-UNRESOLVED-PROPS-TYPE': 'import the props type or define it in scope',
  'ATL-W-UNSUPPORTED-PROPS-ANNOTATION': 'name the props type instead of inlining the object',
  'ATL-W-UNRESOLVED-INCLUDE-PACKAGE': 'check the package name or install it alongside the app',
  'STT-W-SKIPPED-FILE': 'fix the file so it parses and reads cleanly',
  'TGN-W-UNKNOWN-TOKEN-CATEGORY': 'move the tokens into a printed category',
  'TGN-W-INVALID-RECIPE-NAME': 'rename the recipe so it forms a TypeScript type name',
  'TGN-W-EMPTY-RECIPE': 'fill in the variant axes or drop the recipe',
  'TGN-W-INVALID-COMPOUND-VARIANT': 'point the compound row at declared axes and values',
  'TGN-W-UNKNOWN-STRICT-CATEGORY': 'use colors, radii, or spacing for strict',
  'TGN-W-ABSENT-STRICT-CATEGORY': 'declare tokens in the category or drop it from strict',
  'TGN-W-EMPTY-FONT-FAMILY': 'declare weights for the family or drop it',
}

/** The fix hint for a warning code, or undefined when the code has none. */
export function warningHintFor(code: string | undefined): string | undefined {
  if (code === undefined) return undefined
  return WARNING_HINTS[code]
}
