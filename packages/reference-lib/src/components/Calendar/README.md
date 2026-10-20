# Calendar

A Gregorian date picker in four modes — day, range, month, year — over
three private collections, with a required locale driving headers, grid
padding, week boundaries, and every label. The root is composition only:
the fail-closed gate runs first, six hooks resolve the subtree state in
their original order, and authored parts slot into mode-gated defaults
while unrecognized children render on as chrome.

Contract: the Calendar contract. Cases: the Calendar test catalog.

Beneath the hooks, each problem owns a folder. The date kernel speaks
canonical ISO so lexical comparison is chronological. Selection answers
committed matching and range completion as pure decisions. Navigation
resolves keyboard moves without touching selection. The day-grid folder
resolves preview bands, roving targets, and per-date models once per
date so sections can never disagree. The collections folder rovers the
month and year fields. Shared holds the diagnostics, names, slot
detection, and prop gate all of them ask. Pure decisions carry
colocated unit tests; browser behavior proves out in CT.

DateField imports the date kernel directly from the `iso` module; that deep edge is internal to the Calendar and DateField pair, not a public contract.
