# Menu

Popup menu tree: a root Menu adopts its Popover layer while each open
submenu owns one child Overlay layer, all chained through levels. Root
open state lives on the wrapping Popover; nested open is controlled
with omitted open meaning controlled false. Keyboard entry plants a
first/last strategy the root consumes once per open; pointer travel
crosses submenus through a grace polygon with frozen open/close delays.

Contract: the Menu contract. Features: the Menu feature catalog.
Cases: the Menu test catalog.

The root file is a dispatcher only: nested inside a level it renders a
submenu, otherwise the root. Behavior splits by job. Levels own the
tree — entry intent, intent timers, registry orderings, and the
root/nested level hooks. Hooks own entry keys, choice dismissal, and
the focus, press, and travel effects. Focus owns restoration, item
discovery, and shadow-aware scope reads. Intent owns the pointer grace
geometry. Parts render the root, nested scope, trigger, content, and
every item kind. Pure decisions carry colocated unit tests; mounted
behavior proves out in colocated Vitest and CT.

Up: components.
