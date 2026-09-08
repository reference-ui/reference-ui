# Overlay

Public surface lives at this root: `Overlay.tsx`, `types.ts`, `index.ts`.

Contract: [Overlay.md](./Overlay.md). Proof: [SPEC.md](./SPEC.md).

| Folder | Role |
| :--- | :--- |
| [`context/`](./context) | React context for parts |
| [`hooks/`](./hooks) | Open state, part registry, stack registration |
| [`parts/`](./parts) | Trigger, Portal, Backdrop, Content, Arrow, Handle |
| [`stack/`](./stack) | Document-scoped layer store |
| [`dismiss/`](./dismiss) | Escape and outside-press |
| [`geometry/`](./geometry) | Unbound, anchored, and edge placement |
| [`isolation/`](./isolation) | Inert, scroll lock, pointer lock |
| [`gesture/`](./gesture) | Handle swipe thresholds |
| [`shared/`](./shared) | Event path, refs, diagnostics |
