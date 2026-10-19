# dates

The Gregorian kernel everything else speaks: canonical ISO parsing,
formatting, validation, and bounded arithmetic; locale week starts and
ordered weekday headers; the padded month grid; blocked-span scans for
range completion and preview; and pane seating — adjacent-month steps,
home views, and value-derived months. Pure and total: invalid strings
never leave the gate, and every module proves itself in colocated unit
tests. DateField's text engine imports this kernel directly.

Up: [Calendar](../README.md).
