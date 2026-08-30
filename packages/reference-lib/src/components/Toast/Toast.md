# Toast

Proof: [TESTS.md](./TESTS.md).

Infrastructure for transient application content. Does not prescribe appearance or meaning. No semantic variants (`success`, `error`, `loading`).

Toast is **not** Overlay: no focus trap, no page inert, no layer-stack modality. The toaster is mounted by `ReferenceLibrary`. It renders at the React root without a portal or a required React context. The queue is a document-scoped Zustand store ([hooks.md](../../core/hooks/hooks.md)).

```tsx
<ReferenceLibrary
  toaster={{
    defaultPosition: "bottom-end",
    defaultDuration: 5000,
    limit: 4,
  }}
>
  <App />
</ReferenceLibrary>
```

```tsx
const ProjectSavedToast = toast.define({
  duration: 4000,

  render({ project }, { close }) {
    return (
      <div>
        <span>{project.name} was saved</span>
        <button type="button" onClick={close}>
          Dismiss
        </button>
      </div>
    )
  },
})

toast.show(
  ProjectSavedToast,
  { project },
  { announce: `${project.name} was saved` }
)
```

Definitions can replace one another while preserving identity:

```tsx
const id = `upload:${file.id}`

toast.show(UploadingToast, { file }, { id, announce: `Uploading ${file.name}` })
toast.update(id, UploadCompleteToast, { file }, { announce: `${file.name} was uploaded` })
toast.dismiss(id)
```

```text
Invocation options → toast definition → toaster defaults
```

`toast.dismiss()` without an ID dismisses every active toast.

`announce()` is the same live-region path without a toast.

Timers pause while pointer or keyboard focus is inside a toast and while a
modal Overlay is the top layer. If focused toast content dismisses itself,
focus safely returns to the previously focused connected control. That is
queue/focus lifecycle behavior, not Overlay modality.

Library defaults are 5000ms, `bottom-end`, and a global visible limit of 4.
ReferenceLibrary renders one `div[data-reference-toast-host]`, one
`div[data-reference-toast-position]` per occupied position, and one
`div[data-reference-toast-id][data-state]` per visible toast. Item wrappers use
Presence and expose `--reference-toast-index`/`--reference-toast-count`; the
definition's output remains untouched inside.

## Proposed API

```ts
type ToastId = string

type ToastPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end"

interface ToastControls {
  id: ToastId
  close(): void
}

interface ToastDefinition<Props> {
  render(
    props: Props,
    controls: ToastControls
  ): React.ReactNode

  duration?: number | false
  position?: ToastPosition
}

interface ToastOptions {
  id?: ToastId
  duration?: number | false
  position?: ToastPosition
  announce?: string
  document?: Document
}

toast.define<Props>(
  definition: ToastDefinition<Props>
): ToastDefinition<Props>

toast.show<Props>(
  definition: ToastDefinition<Props>,
  props: Props,
  options?: ToastOptions
): ToastId

toast.update<Props>(
  id: ToastId,
  definition: ToastDefinition<Props>,
  props: Props,
  options?: Omit<ToastOptions, "id">
): void

toast.dismiss(
  id?: ToastId,
  options?: { document?: Document }
): void

announce(
  message: string,
  options?: {
    politeness?: "polite" | "assertive"
    document?: Document
  }
): void
```

---

## Problems we own

### Stable identity and update-in-place

Loading → complete is the same toast, not close + add. Spectrum `ToastQueue.add()` always generates a random key — no `update(id)`. Sonner/Base UI/Zag merge by id.

**Vendor.** `vendor/sonner/src/state.ts` — same id merges; `dismissedToasts` prevents resurrection of stale props; StrictMode `dismiss` is deferred via `requestAnimationFrame` so a re-`create` of the same id cancels the pending dismiss. Base UI ignores updates while `transitionStatus === 'ending'`; re-add same id while ending removes then adds.

**Lift** Sonner id / update / dismiss-all. **Leave** `success` / `error` / `loading` chrome — applications model lifecycle by swapping definitions (`toast.update` to a different `define()`).

### Remaining-time pause, not duration reset

Hover must pause and resume **remaining** time. Resetting to full duration on every hover cycle extends life forever. `setTimeout(..., Infinity)` fires immediately in browsers — guard it (Sonner). Duration **change** on update may reset the clock (Sonner/Zag do); freeze that.

**Vendor.** Sonner: hover / `document.hidden`. Base UI: remaining subtraction on pause/resume; sticky `areTimersPaused` bug when the last timed toast closes (`store.test.ts`). Spectrum `Timer` starts on mount, not on add; becoming visible again resets full timeout.

**Lift** remaining-time math (Base UI tests are the cautionary suite). Pause sources we own: pointer over toast, **and** modal Overlay as top layer. No vendor pauses on modal Overlay — Spectrum/Sonner only mark the region `data-react-aria-top-layer` so overlays don’t hide the toaster. Zag `trackDismissableBranch` so toast clicks don’t dismiss Dialog. Those are coordination flags, not timer pause.

### Limit

Sonner `visibleToasts` hides extras but keeps them mounted/timed. Base UI sets `limited` + `inert` and keeps them in the store. Spectrum/Zag wait in a queue until a slot frees.

**Freeze.** Use a global FIFO waiting queue. At most `limit` records have
visual DOM and running timers; excess records are not mounted and do not age
until promotion. Lowering the limit demotes newest excess visible records
ahead of records already waiting while preserving their remaining time.
Raising it promotes in FIFO order. `limit` is a toaster default on
`ReferenceLibrary`.

### Announce vs visual

Visible toast and AT announcement are related, not identical. `announce`
options go through `announce()` mounted by `ReferenceLibrary` — the same
live-region path without a toast. Reference UI does not assign alert/dialog
semantics to arbitrary visual JSX. Spectrum's NVDA workaround temporarily
`aria-hidden`s visual alert content until a layout effect; it is deliberately
not ported because announcements use a separately mounted live region here.

**Leave.** Icons, styles, promise helpers that imply `loading` as a library variant.

### Exit

Sonner uses a hardcoded `TIME_BEFORE_UNMOUNT = 200`. Toast item wrappers always
use the shared Presence owner and wait for their effective transition or
animation to complete rather than using a magic timeout.

### Subscribe before mount

Imperative `toast.show` can fire before `ReferenceLibrary` mounts. Sonner replays active toasts on subscribe. Base UI `createToastManager` can lose events.

**Lift** replay-on-subscribe.

---

## Convergence

Primary: **Sonner `state.ts`** for identity, update-in-place, dismiss-all,
replay, and hover pause. Spectrum/Zag supply waiting-FIFO limit behavior.
Base UI store tests supply remaining-time and pause-flag race evidence.
Spectrum/Zag also cover live-region and dismissable-branch coordination with
Overlay.

**Leave.** Sonner styles/assets, semantic variants, Overlay trap/inert, public Toast.Provider.
