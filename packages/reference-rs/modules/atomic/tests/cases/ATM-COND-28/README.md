# ATM-COND-28

Pseudo-element placements (`& ::after`, `::before&`, `:before&`,
`::before &`) print textually at one level; combinator stacks
(`&:last-child` + `& :is(.a, .b)`, the `& .b/.c/.d` tower, the
`& > .row > .cell` tower) distribute down the chain. Contract:
[SPEC.md](../../../SPEC.md) (SPEC-V2-73).
