# Calendar

A Gregorian date picker in four modes — day, range, month, year — over
three private collections, with a required locale driving headers, grid
padding, week boundaries, and every label. The root is composition only:
the fail-closed gate runs first, six hooks resolve the subtree state in
their original order, and authored parts slot into mode-gated defaults
while unrecognized children render on as chrome.

Contract: [Calendar.md](./Calendar.md). Cases: [TESTS.md](./TESTS.md).

Beneath the hooks, each problem owns a folder. The date kernel speaks
canonical ISO so lexical comparison is chronological. Selection answers
committed matching and range completion as pure decisions. Navigation
resolves keyboard moves without touching selection. The day-grid folder
resolves preview bands, roving targets, and per-date models once per
date so sections can never disagree. The collections folder rovers the
month and year fields. Shared holds the diagnostics, names, slot
detection, and prop gate all of them ask. Pure decisions carry
colocated unit tests; browser behavior proves out in CT.

| Folder | Role |
| :--- | :--- |
| [`dates/`](./dates) | ISO kit, weeks, grid, spans, pane seating |
| [`selection/`](./selection) | Matchers, range completion, collection paint |
| [`navigation/`](./navigation) | Keyboard move resolution |
| [`day-grid/`](./day-grid) | Preview, roving targets, per-date models |
| [`collections/`](./collections) | Shared month/year rover and year window |
| [`hooks/`](./hooks) | Pane, availability, selection, today, locale, grid focus |
| [`parts/`](./parts) | One file per public part |
| [`shared/`](./shared) | Diagnostics, names, slots, keys, prop gate |

DateField imports the date kernel directly (`dates/iso`); that deep edge is internal to the Calendar and DateField pair, not a public contract.
