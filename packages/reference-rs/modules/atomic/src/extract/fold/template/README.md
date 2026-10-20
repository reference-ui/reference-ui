# Template hole folding

`${…}` holes into static strings or named refusals. Literals, const leaves, one-hop members, nested templates, operators, and ternaries fold; every other hole records a refusal naming what it was, so the call warns instead of guessing.
