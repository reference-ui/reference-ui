# ATM-RECIPE-16 — Unreadable plain recipe defaults and predicates are refused

A plain recipe refuses an unreadable default or compound predicate with `ATM-E-RECIPE-FIELD`. The refusal names the field, such as `defaultVariants.size` or `compoundVariants[0].tone`, and the refused definition is dropped whole. Related: ATM-RECIPE-15, ATM-RECIPE-17.
