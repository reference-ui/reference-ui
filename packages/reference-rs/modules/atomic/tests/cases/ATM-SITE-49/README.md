# ATM-SITE-49: Computed Keys (Static + Folded Arms)

Probes SPEC-V2-64 end to end. Static keys (`['color']`, `` [`color`] ``,
`[42]`) and single-leaf folded keys (`[k]` over `const k`, `[t.p]`,
`[s[0]]`, `[hov]` conditions including nested `{ [hov]: { [k]: v } }`)
resolve exactly like their bare spellings; folded numerics (`[n]`, `[-pad]`)
ride the ordinary unknown-property path, never `UnfoldableKey`. Entry 40
closes here: helper-call keys (`[gh('cool')]`) fold through the SITE-31
fence — the template body (SITE-67) evaluates over the folded argument —
and nest under the returned selector exactly like a written condition.
Multi-leaf keys and genuinely dynamic keys (`[key]`, `[pick()]`) warn
once per member and keep static siblings. Concat keys fold when
SITE-33 lands the binary node.
