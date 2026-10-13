# ATM-COND-23 — Comma-member scoping station (ATM-COND-23, SPEC-V2-68)

Bare comma members scope to the parent (`'&:not(:first-child), :only-child'`
prints `.<cls>:not(:first-child), .<cls> :only-child`) and stacked templates
distribute over every parent member. Contract:
[SPEC.md](../../../SPEC.md) (SPEC-V2-68).
