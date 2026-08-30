# ReferenceLibrary

Mounts Reference UI's application-level runtime systems.

Not a React context provider. Does not inject values into descendants. Provides a stable React-level mount for Toast and `announce()`.

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

## Proposed API

```ts
interface ReferenceLibraryProps {
  children?: React.ReactNode
  toaster?: {
    defaultPosition?: ToastPosition
    defaultDuration?: number | false
    limit?: number
  }
}
```
