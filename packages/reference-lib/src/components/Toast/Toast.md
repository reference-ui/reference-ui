# Toast

Infrastructure for transient application content. Does not prescribe appearance or meaning. No semantic variants (`success`, `error`, `loading`).

The toaster is mounted by `ReferenceLibrary`. It renders at the React root without a portal or React context.

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
