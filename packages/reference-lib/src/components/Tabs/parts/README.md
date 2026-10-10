# Tabs parts

The renderings of the tabset, one file per compound part. `list` is the
tablist row and RovingFocus root with the automatic-activation policy;
`tab` is one tab stop with pointerdown-early gesture activation;
`panel` is the panel half of one Tab/Panel pair with keepMounted;
`selection-sync` is the null-rendering bridge that moves the kernel tab
stop when selection or the registry changes. Parts read tabset state
from context and report focus back through the notifiers — the hooks
decide, the parts render.
