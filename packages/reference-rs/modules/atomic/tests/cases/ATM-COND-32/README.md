# ATM-COND-32 — Range-suffixed keys over non-breakpoint stems are unknown properties

A style-object key is a range condition only when its parts are breakpoint names.
`<bp>Down` and `<bp>Only` need `bp` to be a scale name exactly, and
`<from>To<to>` needs both sides to be scale names under ASCII case folding.
Any other key falls to the style-prop check and, not being a style prop, warns
`ATM-W-UNKNOWN-PROPERTY` on the default channel. That warning is the only line
for the key: lookups nested under it add no `ATM-W-MISSING-STYLE-PLAN`.

Probes: `fooOnly`, `fooDown` and the one-sided `mdToFoo` on the literal path;
`barOnly` and the object-valued `bazDown` through a const spread; `quxOnly`
through a folded spread; the object-valued `fooBar`. Each warns unknown property
once. `navDown: 'auto'` is the real `nav-down` property and compiles.
`mdOnly`, `mdDown` and `smToLg` lower to bounded container queries; `lgToSm`
has range shape over real names but runs backwards, so it keeps warning
`ATM-W-UNKNOWN-CONDITION`.

Sibling: ATM-COND-13 (range lowering, including `watDown`).

Contract: SPEC.
