# Announcer

Proof: [SPEC.md](./SPEC.md). Mounted by: [ReferenceLibrary](../ReferenceLibrary/ReferenceLibrary.md).
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

---

## Problems we own

Screen readers only speak a live region when its **text changes after the
region exists**. Mounting a node that already contains text, or setting the
same string twice without a clear, is silent. That is the whole engine.

### Dedicated live path, not toast DOM

Arbitrary toast JSX must not become an accidental AT message. Spectrum’s
NVDA workaround (`aria-hidden` on visual alert content until layout) is
deliberately left: we never put live semantics on the visual card.

**Vendor.** React Aria `@react-aria/live-announcer`. Radix `announce`.
Sonner/Spectrum toast tests that assert visual vs live split.

**Lift** polite/assertive regions, same-string clear-then-reinsert, delayed
clear, document-level mount. **Leave** Spectrum’s singleton `document.body`
mutation, a public `LiveAnnouncer` provider, `clearAnnouncer` /
`destroyAnnouncer`, and per-call `timeout`.

### Document store, not a Provider

`announce()` must work from event handlers, toast internals, and code that
is not under a React context. The store is keyed by `Document` (`WeakMap`),
the same pattern as Toast and Tooltip skip-delay. Overlay, Popover, and Menu
do not read this store.

### Host activation vs pending speech

Calls before `ReferenceLibrary` mounts must not be lost, and they must not
create DOM. After the elected host mounts, pending messages replay into a
**already-existing** live region (insert after mount, never as initial text).

First activation is sticky in the current engine (`activated` never resets on
unmount). Hostless announces after that first mount can land as current store
text and then appear as initial content on remount — which many AT stacks
will not speak. That is a production blocker. See [SPEC.md](./SPEC.md).

### Overlay must not silence or steal the region

An isolating Overlay inerts the page. Live regions have to stay exempt or
modal dialogs eat status. The host is marked `data-reference-overlay-ignore`
and Overlay’s hide-outside already keeps `[aria-live]` /
`[data-reference-announcer-host]`. Toast has the same exemption; the
announcer is a second node, not a child of the toaster.

### One elected host

Two `AnnouncerHost` trees on one document are two live regions with the same
text: double speech. Election and failover belong to ReferenceLibrary. This
runtime must not subscribe as an independent consumer per mount.

---

## Convergence

Primary: React Aria live-announcer **regions + recycle**, with Radix/Aria
same-string replay, mounted as a ReferenceLibrary document runtime instead of
a global body singleton.

Toast owns visual queue, identity, and `{announce}` passthrough. ReferenceLibrary
owns election, failover, and where the host is painted. Announcer owns the
live-region machine: channels, tokens, pending replay, clear delay, and AT-safe
DOM.
