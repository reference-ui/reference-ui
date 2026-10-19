# Menubar parts

The three renderings of the bar, one file per compound part. `menu` is
the identity scope binding one trigger to one popover; `trigger` is the
roving button with Menu keyboard entry and cross-trigger moves;
`content` is the popover panel hosting a `Menu` with root-level arrow
switching. Parts read bar state from context and never own it — the
hooks decide, the parts render.

Up: Menubar.
