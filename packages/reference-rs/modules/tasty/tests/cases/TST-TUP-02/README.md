# TST-TUP-02 — Indexing a rest tuple yields the rest element's item type, and an optional element stays unresolved.

For `[string, ...number[]]`, index `1` and index `number` resolve to the item type `number` and to `string | number`,
not to the array type `number[]` that the rest element is stored as. A labeled rest tuple behaves the same way. An
optional element such as `[string, number?][1]` stays unresolved, because its type would gain `undefined` under
strictNullChecks, which tasty does not know.
