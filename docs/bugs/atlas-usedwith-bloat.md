# `usedWith` bloat and inverted frequencies

**Severity:** Medium (noise, wasted context)
**Area:** Atlas / MCP `get_component`
**Not panda CSS.**

## Observed

1. **Noise.** `Button.usedWith` returns ~70 standard HTML tags (`Abbr`, `Address`, `Caption`, …), each labeled `"rare"`.
2. **Inversion.** `Dialog` (count 2) marks almost every HTML tag `"very common"`.
3. **Payload.** `get_component` balloons to 12–20KB; most of it is tag noise.

## Fix

1. Only include co-occurrences that pass a threshold (for example count ≥ 2 or ratio > 10%).
2. Fix frequency buckets when the target has a tiny sample (`count <= 2`).
3. Cap `usedWith` to the top 5–10 relevant companions.
