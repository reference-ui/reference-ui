# Toast

Proof: [TESTS.md](./TESTS.md).

Infrastructure for transient application content. Does not prescribe appearance or meaning. No semantic variants (`success`, `error`, `loading`).

Toast is **not** Overlay: no focus trap, no page inert, no layer-stack modality. The toaster is mounted by `ReferenceLibrary`. It renders at the React root without a portal or React context.

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

Timers pause while the pointer is over a toast and while a modal Overlay is the top layer. That is queue behaviour, not Overlay.

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

toast.dismiss(id?: ToastId): void

announce(
  message: string,
  options?: { politeness?: "polite" | "assertive" }
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

**Freeze-gate.** Pick one. Lean Sonner hide-in-place unless queue-wait proves necessary. `limit` is a toaster default on `ReferenceLibrary`.

### Announce vs visual

Visible toast and AT announcement are related, not identical. `announce` options go through `announce()` mounted by `ReferenceLibrary` — same live-region path without a toast. Spectrum NVDA hack (content `aria-hidden` until layout) is a screen-reader quirk to steal tests from, not an API.

**Leave.** Icons, styles, promise helpers that imply `loading` as a library variant.

### Exit

Sonner uses a hardcoded `TIME_BEFORE_UNMOUNT = 200`. Overlay-quality Presence is not required for toasts, but if we animate, wait for transition/animation end rather than a magic 200ms.

### Subscribe before mount

Imperative `toast.show` can fire before `ReferenceLibrary` mounts. Sonner replays active toasts on subscribe. Base UI `createToastManager` can lose events.

**Lift** replay-on-subscribe.

---

## Convergence

Primary: **Sonner `state.ts`** (queue, id, update, dismiss all, limit, hover pause). Base UI store tests for remaining-time and pause-flag races. Spectrum/Zag for live-region and dismissable-branch coordination with Overlay.

**Leave.** Sonner styles/assets, semantic variants, Overlay trap/inert, public Toast.Provider.
