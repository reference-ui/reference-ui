import { css } from '@reference-ui/react'

// Nullary helper plus a baked capture (v2 scope.rs:908 shape).
const unit = 'px'
const getColor = () => 'red'
const widthOf = (n: number) => `${n}${unit}`
export const a = css({ color: getColor(), width: widthOf(4) })

// Positional args with a default (v2 scope.rs:1073 shape).
const tone = (base: string, shade: string = '500') => `${base}.${shade}`
export const b = css({ color: tone('purple'), backgroundColor: tone('blue', '700') })

// A default may reference an earlier param.
const pick = (first: string, second: string = first) => second
export const c = css({ color: pick('red') })

// Function declaration with a single return (v2 scope.rs:945 shape).
function getAccent(): string {
  return 'yellow.700'
}
export const d = css({ color: getAccent() })

// Both IIFE spellings fold at the call site.
export const e = css({
  color: (() => 'red')(),
  backgroundColor: (function () {
    return 'blue'
  })(),
})

// Index over a param array (v2 pure_helper_array_index_folds).
const pickSecond = (arr: string[]) => arr[1]
const swatches = ['never', 'purple.900']
export const f = css({ color: pickSecond(swatches) })

// Member read over a param object.
const primaryOf = (theme: { primary: string }) => theme.primary
export const g = css({ color: primaryOf({ primary: 'teal.600' }) })

// A folded test picks the live arm inside the body.
const either = () => (1 === 1 ? 'white' : 'black')
export const h = css({ color: either() })

// A multi-leaf capture fans out through passthrough.
declare const flag: boolean
const dynamic = flag ? 'white' : 'black'
const passthrough = () => dynamic
export const i = css({ color: passthrough() })

// Object-return spread beside a static sibling (v2 scope.rs:1030 shape).
const getColorConfig = () => ({ color: 'teal.600', backgroundColor: 'navy' })
export const j = css({ ...getColorConfig(), padding: '4px' })

// A folded-test arm inside the returned object.
const getHover = (on: boolean) => ({ color: on ? 'red' : 'blue' })
export const k = css({ ...getHover(true), margin: '1r' })

// --- fence edges: each refuses with a diagnostic, siblings kept ---

// Aliases never lower (v2 pure_helper_local_alias_does_not_fold).
const alias = getColor
export const r1 = css({ color: alias(), margin: '2r' })

// Multi-statement bodies never lower.
function blocky(): string {
  const inner = 'red'
  return inner
}
export const r2 = css({ color: blocky(), margin: '3r' })

// Bitwise-not is outside the fence (v2 admits only +, -, !).
const invert = () => ~1
export const r3 = css({ color: invert(), margin: '4r' })

// Assignment in the body never lowers.
const assign = (x: string) => (x = 'blue')
export const r4 = css({ color: assign('red'), margin: '5r' })

// A reassigned callee names its write.
let shifting = () => 'red'
shifting = () => 'blue'
export const r5 = css({ color: shifting(), margin: '6r' })

// Bare uncalled function values never fold.
export const r6 = css({ color: getColor, margin: '7r' })

// Binary arguments fold through the shared binary node (tail seam: SITE-33).
export const m = css({ width: widthOf(2 + 2) })

// A non-finite binary argument refuses the whole call, sibling kept.
export const r7 = css({ color: tone('purple', 1 / 0), margin: '8r' })

// --- 39-F2: body-eval failure propagates, verbatim v2's `?` ---

// A missing member left of && refuses the whole call (v2 pure_fn.rs:522).
const pickMissing = (o: { missing: string }) => o.missing && 'red'
export const f2a = css({ color: pickMissing({} as { missing: string }), margin: '9r' })

// A division by zero left of || refuses the whole call.
const orFallback = (n: number) => n / 0 || 'x'
export const f2b = css({ color: orFallback(1), margin: '10r' })

// A missing member as a ternary test refuses instead of unioning arms.
const pickBranch = (o: { missing: string }) => (o.missing ? 'a' : 'b')
export const f2c = css({ color: pickBranch({} as { missing: string }), margin: '11r' })

// A division by zero as a ternary test refuses instead of unioning arms.
const divBranch = (n: number) => (n / 0 ? 'a' : 'b')
export const f2d = css({ color: divBranch(1), margin: '12r' })

// --- 39-F3 (scoped follow-up): a pure call in a const init refuses ---
// v2 folds `const x = getColor()` via resolve_declarator→call_to_literal;
// the fence folds at call sites only, so the use warns (see README).
const calledColor = getColor()
export const f3 = css({ color: calledColor, margin: '13r' })
