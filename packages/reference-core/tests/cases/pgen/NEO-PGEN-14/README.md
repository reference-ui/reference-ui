# NEO-PGEN-14 — variant and colorMode stamp, DOM props pass through, and the leak sweep stays empty

The world renders three Div probes: a variant twin painted by a global
tag recipe, a dark colorMode island, and a passthrough probe carrying DOM
props, a click handler, and a ref callback over both style paths. The
spec asserts the variant stamps `data-variant` and the recipe paints it,
the island stamps `data-color-mode`, every DOM prop, the handler, and the
ref reach the host, and both style paths paint — then sweeps every probe
for styling and metadata keys landing as bare attributes and asserts the
sweep finds nothing. Related: NEO-PRIM-06 (the variant precedent),
NEO-PRIM-08 (the passthrough precedent), NEO-PGEN-06 (the island arm).
