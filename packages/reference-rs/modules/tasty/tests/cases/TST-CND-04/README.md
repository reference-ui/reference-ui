# TST-CND-04 — A recursive alias that never settles ends unresolved within the expansion budget instead of crashing the scan.

`Nest<T>` and the tuple-length `Repeat` recurse with a growing argument, and `Chain<'x'>` recurses through a decidable
false branch forever. TypeScript stops these with an instantiation error, so tasty must end them unresolved: each
expansion counts toward a depth budget, and a budget that runs out fails the evaluation closed. A template literal
that grows by one character per step still settles to `'done'` in ten expansions, and a template literal union past
the member cap fails closed rather than expanding without bound.
