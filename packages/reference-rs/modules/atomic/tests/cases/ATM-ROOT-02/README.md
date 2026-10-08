# ATM-ROOT-02

An author `:root` definition of `--spacing-root` keeps its value and its
placement inside `@layer global`, where cascade rank beats the lower baked
`@layer root`: the author always wins. Rhythm utilities still resolve their
calc formulas against the effective root. Contract: [SPEC.md](../../../SPEC.md).
Siblings: `ATM-ROOT-01` (unconditional default, zero rhythm);
`NEO-CHAIN-07` (the extends-chain winner plus rhythm paint against the
effective root).
