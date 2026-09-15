# `disabled` classified as a style prop

**Severity:** Low / medium
**Area:** Atlas / MCP `get_component`, `get_component_props`
**Inventory bug.** The style-prop whitelist happens to come from the current compiler; the mislabel is still wrong after a panda swap.

## Observed

On primitives like `Button`, the HTML attribute `disabled` is flagged `"styleProp": true`.

An agent that trusts that flag may treat `disabled` as an atomic StyleProp instead of a native state attribute.

## Fix

Do not mark observed HTML/ARIA state attributes as style props. Cross-check against the real StyleProps surface, not “any string the compiler might accept.”
