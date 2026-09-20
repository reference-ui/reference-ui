# ATM-LEAF-11

Responsive-object leaves refuse `!` at the extraction boundary. The
whole-object plan carries one important flag, so a per-leaf marker can
never be served: `css({ width: { base: '50px!' } })` warns
`ATM-W-RESPONSIVE-LEAF-IMPORTANT` on default (naming prop `width` and
leaf `base`), the refused leaf pushes no want, and the plan still
serves the stripped value as a diagnosed non-important fallback — no
orphan `!` class mints. Sibling leaves (`md`) and sibling props
(`color`) still extract. Contract: [SPEC.md](../../../SPEC.md).
