# TST-VAL-01 value resolution

Verifies emission of additive resolved payloads for value-derived types such as keyof and indexed access.
Ensures evaluated union values are attached alongside structural definitions.
Proves primary SPEC ID anchor TST-VAL-01.

Also pins cross-file composition (doom-night C): `keyof typeof
importedSizes` over a named value import resolves to the key union,
proving imported `typeof` payloads feed downstream evaluation.
