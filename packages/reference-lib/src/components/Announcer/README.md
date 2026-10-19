# Announcer

Proof: [case.json](./case.json) indexes the cases, [TESTS.md](./TESTS.md) holds each case's setup, action, and assert rows, and a case is proven when a passing test title contains its ID (`pnpm agentct Announcer --e2e`). Mounted by: [ReferenceLibrary](../ReferenceLibrary/ReferenceLibrary.md).
Used by: [Toast](../Toast/Toast.md) `announce` options, and any application
code that needs assistive-technology status without a visual toast.

Document-scoped live-region runtime. Not a visible component. Not Overlay. Not
Toast. Two hidden ARIA live regions plus `announce()`.

```tsx
<ReferenceLibrary>
  <App />
</ReferenceLibrary>
```

```ts
announce("Project saved")
announce("Session expired", { politeness: "assertive" })
announce("Draft stored", { document: iframe.contentDocument! })
```

Applications never mount `AnnouncerHost`. `ReferenceLibrary` is the only
supported host. Toast `{ announce: "…" }` is the same path: visual card and
live text are separate on purpose.

Multi-document topology: mount one `ReferenceLibrary` per
document (top page plus each same-origin iframe/microfrontend root) and
target cross-document speech with `announce(message, { document })`. A
direct `<AnnouncerHost document={doc}>` mount is test-only — it is not
exported from the public barrel and is not a supported recipe.

## Public API

```ts
announce(
  message: string,
  options?: {
    politeness?: "polite" | "assertive"
    document?: Document
  }
): void
```

Omitted `politeness` is `"polite"`. Omitted `document` is valid only when one
document host is eligible. Blank / whitespace-only messages are ignored.

`AnnouncerHost`, `getAnnouncerSnapshot`, and `ANNOUNCE_CLEAR_DELAY` are
runtime/test internals. They are not application API.

## Engine

Screen readers speak a live region only when its text changes after the
region exists: same-string speech clears then reinserts, and text recycles
silently after the delay. Calls before mount queue as pending and replay in
order once the elected host subscribes; unmount resets activation when no
subscriber remains. The host stays exempt from isolating Overlays, and one
host speaks per document with election and failover owned by ReferenceLibrary.

The root is composition only: `Announcer.tsx` renders the hidden live-region
pair from a session hook, and `store.ts` owns every message decision. The
hook claims the single-host election, registers the document, subscribes to
the store, and replays pending speech; the election arbitrates which mount
speaks per document; shared holds the development warning they all ask.
Pure decisions carry colocated unit tests; AT behavior proves out in CT.

There is no `parts/` — the host has one fixed rendering, owned by the
root — and no `context.ts`: with no compound parts, there is no subtree
to scope. `internal.ts` keeps its path because ReferenceLibrary imports
the host entry directly; it re-exports, it is not a shim.

Up: [components](../components.md).
