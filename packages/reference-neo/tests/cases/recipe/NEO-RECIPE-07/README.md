# NEO-RECIPE-07 — a non-object-literal recipe fails sync with a located diagnostic

The world passes an identifier to `recipe()` instead of an inline object
literal. The spec checks `sync()` rejects with the located inline-literal
refusal carrying file, line, and column, and no half-written folder
survives behind the failure.

Evidence: `[atm]` ATM-RECIPE-06 + RS-18 located diagnostics (landed).
