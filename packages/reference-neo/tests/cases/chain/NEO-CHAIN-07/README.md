# NEO-CHAIN-07

The baked `@layer root` spacing-root default ranks below every author
definition in an extends chain: standalone it applies (`0.25rem`, `140r`
paints `560px`), under a real synced upstream defining `0.5rem` the upstream
author wins (`1120px`), and a consumer `:root` of `1rem` wins over both
(`2240px`). The merged sheet hoists exactly one root block ahead of the
package statement; upstream root copies drop at the merge.

Related: `ATM-ROOT-01` (unconditional default at the compile seam),
`ATM-ROOT-02` (author override keeps value and placement),
`NEO-CHAIN-06` (the real-sync extends pattern this case reuses),
`NEO-CSS-16` (rhythm continuity plus the unscanned-`r` miss).
