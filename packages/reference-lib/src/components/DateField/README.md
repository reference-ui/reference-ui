# DateField

A locale text field bound to ISO dates, in two hosts: the single field
and the start/end Range. Each host pairs a dirty-buffer text machine
(live typing, blur/Enter commits, caret segment stepping, composition,
form observers) with an optional picker popover, and both unfold their
compound parts through one shared slot registry. The roots are
composition only: guards, one machine hook, and the slotted host.

Contract: [DateField.md](./DateField.md). Cases: [TESTS.md](./TESTS.md).

Beneath the hooks, each problem owns a folder. The engine parses and
formats locale text and steps segments. The slots registry carries
authored part props from registration to layout. The hooks own the two
edit machines plus the shared form observers. The parts register,
alias, and unfold. Shared holds the prop merging and caret restore
both machines ask. Pure decisions carry colocated unit tests; browser
behavior proves out in CT.

Two roots, not one: `DateField.tsx` and `DateFieldRange.tsx` are sibling
hosts over the same engine, slots, and shared helpers. The deep import of Calendar's date kernel is internal to the Calendar and DateField pair, not a public contract.

Up: [components](../components.md).
