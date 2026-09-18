# NEO-COND-11 — `_groupHover` / `_peerFocus` paint from an ancestor `.group` / preceding `.peer`

The world calls `css()` with a base ink color plus `_groupHover` brand
on a paragraph nested in a `.group` div, and a base ink color plus
`_peerFocus` brand on a paragraph following a `.peer` button. The spec
checks the sheet carries three utilities (one shared base) with the group
and peer wraps,
and the group child paints brand under a real hover of the group while
the peer sibling paints brand while the peer has focus — each returning
to ink after.

Evidence: `[atm]` P1 #13 (group/peer COND-09); R1 probe
`/tmp/cond-batch4-r1/probe.mjs` emits
`:is(:where(.group, [data-group]):is(:hover, [data-hover]) *)` and
`:is(:where(.peer, [data-peer]):is(:focus, [data-focus]) ~ *)`.

> Search terms: general sibling, tilde, marker class, group hover, tailwind group peer, conditions/group-hover, conditions/peer-focus, combinators/sibling
