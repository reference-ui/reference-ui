# hooks

When Portal is allowed to exist. The server and the first paint render
nothing — portalling to `document.body` before mount would crash or
mismatch — so the mount gate opens inside a layout effect, a
commit-time re-resolution keeps a swapped `container` prop honest, and a
frame check catches ref destinations that attach after mount. The hook
returns data only (`mounted`, the resolved node); it never renders, so
the root stays a single conditional around a single `createPortal`.
