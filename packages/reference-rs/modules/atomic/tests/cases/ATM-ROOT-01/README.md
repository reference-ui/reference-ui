# ATM-ROOT-01 — Baked root-default

The baked `@layer root` spacing-root default emits first in the sheet even
when the system defines no author `:root` and the input uses zero rhythm
values: the default is unconditional (CONTINUITY-01), so rhythm
rules can never dangle. The default block is the only `--spacing-root`
definition here. Contract: [SPEC.md](../../../SPEC.md).
Siblings: `ATM-ROOT-02` (author override wins); `CORE-CHAIN-07` (the
extends-chain winner plus rhythm paint against the effective root).
