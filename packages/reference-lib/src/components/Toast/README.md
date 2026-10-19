# Toast

Ephemeral stacked notifications: a Sonner-vocabulary API (`toast`, promises,
defined toasts) writes records into a per-document store, and the host
mounts the visible window as measured, swipeable, auto-dismissing piles.
The root renders the host and assigns the chrome compound; everything
else is a submodule with a job.

Contract: [Toast.md](./Toast.md).

Calls flow down: `api/` resolves content versus title, announces, and
delegates to the record core in `state/`, which layers invocation over
previous over library defaults with generation guards. The host reads
the same store through `hooks/use-toast-store`, slices the shown window
in `stack/layout`, and renders one `stack/` pile per occupied position.
Each card composes presence, swipe, auto-dismiss, focus restore, and
measurement hooks over the queue kernel's countdowns and physics plus
`styling/` paint; `parts/` chrome reads per-item overrides from the
private `context.ts` scope. `shared/` holds the nameless plumbing —
IDs, diagnostics, class names, pointers, direction — that every layer
imports.

Coupling: `toastQueue.ts` stays at the root instead of splitting into
`timing/`/`swipe/`/`state/queue` because ReferenceLibrary deep-imports
`DEFAULT_TOAST_HOTKEY` from that path (`parts/toast-props.ts` and its
test). New code imports the kernel rather than duplicating it; no shim.
If that importer ever moves to the index, the kernel's clusters —
visibility windows, countdowns, pause flags, swipe physics, promise
splitting, hotkeys — are the natural next split, each with its tests.

Pure decisions carry colocated unit tests; mounted behavior — stacking,
swipe, countdowns, focus return, snapshots — proves out in CT. Note the
preserved quirk: `ToastActionButton` at the index is a type alias of the
action config, not the button value; the button itself ships on the
`Toast` compound and as `ToastAction` inside `parts/`.

Up: [Components](../components.md).
