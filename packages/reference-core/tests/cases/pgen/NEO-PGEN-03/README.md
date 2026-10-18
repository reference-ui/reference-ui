# NEO-PGEN-03 — the 13 html-form probes keep native behavior under style props with no key leakage

The world renders one probe per html-form family member with native
wiring: an uncontrolled text input and checkbox, a submit button driving a
counter, a select with an optgroup, meter and progress with native values,
a label bound by `for`, and a fieldset with its legend. Every probe paints
`color="brand"`. The spec asserts each probe's element name, marker, layer
stamp, brand paint, and styling-key absence, then proves native behavior
firsthand: fill lands in the text input, a click checks the checkbox and
fires the button handler, and select, textarea, meter, and label all report
their native state. Related: NEO-PRIM-08 (the passthrough precedent),
NEO-PGEN-01 (the flow slice with the same paint contract).
