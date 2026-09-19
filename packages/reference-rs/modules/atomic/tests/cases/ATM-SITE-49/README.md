# ATM-SITE-49: Static Computed Keys (Static Arm)

Probes SPEC-V2-64's static half: `['color']`, `` [`color`] ``, and `[42]`
resolve through the key table exactly like their bare spellings, while a
genuinely dynamic key (`[key]`, `[pick()]`) warns once per member and
keeps its static siblings. Folded keys (`[k]` over `const k`, concat
keys) are the Ph3 half and are not probed here.
