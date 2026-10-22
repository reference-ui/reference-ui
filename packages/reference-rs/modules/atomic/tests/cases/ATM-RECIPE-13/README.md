# ATM-RECIPE-13 — Unreadable slotted recipe fields are refused

A slotted recipe refuses each unreadable field with `ATM-E-RECIPE-FIELD`. That includes a named or spread `variants` map. A slot map that is not an inline object keeps its `ATM-E-RECIPE-SLOT` refusal. Related: ATM-RECIPE-11, ATM-RECIPE-12, ATM-RECIPE-14.
