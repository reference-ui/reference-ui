# TST-CND-03 — A conditional over any, unknown, never or a fractional number agrees with TypeScript or stays unresolved.

`string extends unknown` is true and `1.5 extends number` is true, so both resolve to the true branch. `string extends
number` is false. `any` and `never` as a check type fail closed: TypeScript answers `'yes' | 'no'` for `any` and
distributes `never` when it is a naked parameter, and tasty cannot tell those cases from a written `never`, so the
`resolved` field stays absent instead of picking a branch.
