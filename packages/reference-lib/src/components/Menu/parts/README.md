# Menu parts

The renderings of the menu tree, one file per component. `root` adopts
the Popover layer and renders the vertical roving menu; `nested` owns
one submenu Overlay and provides the child level; `trigger` is the
submenu parent row with anchor registration and hover intent;
`content` is the submenu panel with entry focus and close restore. The
items — command, checkbox, radio group and radio, link, separator —
share the choice activation order (native handler, cancelable
onSelect, one state request, optional dismissal) and the indicator
chrome. Parts read tree state from context and hooks — the levels
decide, the parts render.
