# ReferenceLibrary test contract

Playwright: `matrix/lib/tests/e2e/reference-library.spec.ts`
Page: `/reference-library`

ReferenceLibrary owns the document-level mount and failover policy for Toast,
`announce()`, and Tooltip's warm/skip-delay group. It is not a descendant
context contract.

For multiple React roots in one document, the earliest live
`ReferenceLibrary` is the active host and later mounts are standbys. Unmounting
the host transfers runtime rendering and queued state to the next mount without
duplication. Different `Document` objects have independent hosts.

## API freeze decisions

1. `ReferenceLibrary tooltip={{skipDelay}}` configures the document warm group;
   omission is 300ms.
2. Global `toast`/`announce` options accept an explicit `document`; omission is
   valid only when one document host is eligible.

## Source evidence

- `vendor/sonner/test/tests/basic.spec.ts` — “toast created before the Toaster
  mounts is still shown”.
- `vendor/sonner/src/state.ts` — replay-on-subscribe queue semantics.
- React Aria's live announcer and Radix `announce` — one document-level live
  region and delayed clearing.
- Radix Tooltip Provider `skipDelayDuration`, React Aria `globalWarmedUp`, Zag
  `setGlobalId`, and Floating UI `FloatingDelayGroup` — global tooltip warmup;
  their public Providers are excluded.

## Required cases

### Transparent application mount

- [x] `RL-DOM-01` `[reference]` `[browser]` —
  **ReferenceLibrary should leave application DOM transparent when it mounts
  document runtimes.** Render `<main id="app"><button>Save</button></main>` as
  its child, then compare the element parentage, roles, attributes, and event
  behavior with the same tree rendered alone. Assert that no
  ReferenceLibrary wrapper or descendant-context attribute appears and the
  child nodes retain their identities, proving the application mount is
  structural rather than a provider boundary.
- [x] `RL-DOM-02` `[reference]` `[browser]` —
  **ReferenceLibrary should keep runtime hosts in its React root when Toast and
  announcement infrastructure mount.** Mount the library into `#root`, show a
  toast, and call `announce("Saved")` for that `document`. Assert that
  `div[data-reference-toast-host]` and both live-region paths are descendants
  of `#root`, not `document.body` or a `Portal` destination, which preserves
  React-root and ShadowRoot ownership.
- [x] `RL-DOM-03` `[reference]` `[browser]` —
  **ReferenceLibrary should not become a descendant requirement when other
  primitives render outside it.** Render controlled Overlay, Popover, Menu,
  and an ordinary button as siblings of a library, then open and use each
  primitive. Assert their public callbacks, focus, and DOM work without moving
  beneath ReferenceLibrary, proving layer, focus, and popup ownership remains
  with those primitives.
- [x] `RL-DOM-04` `[reference]` `[browser]` —
  **ReferenceLibrary should preserve document runtime identity when application
  children change.** Queue one visible toast with ID `"save"`, establish a
  300ms Tooltip warm window, and replace `<App key="a" />` with different
  children without replacing ReferenceLibrary. Assert the host elements keep
  their identities, `"save"` remains single with its remaining timer, and the
  warm window does not restart or disappear, preventing child reconciliation
  from remounting global systems.

### Before mount, mount, and unmount

- [x] `RL-LIFE-01` `[vendor]` `[browser]` —
  **ReferenceLibrary should replay a targeted toast when it mounts after the
  toast was shown.** Before any library exists, call
  `toast.show(Saved, {label: "Draft"}, {id: "pre", duration: 4000, document})`,
  then mount ReferenceLibrary in that document. Assert one `"pre"` wrapper
  renders with `"Draft"` and the original 4000ms duration starts at host
  activation; this ports
  `vendor/sonner/test/tests/basic.spec.ts` “toast created before the Toaster
  mounts is still shown” without adopting its Toaster API.
- [x] `RL-LIFE-02` `[convergence]` `[browser]` —
  **ReferenceLibrary should deliver a pending announcement when its target
  document gains a host.** Call
  `announce("Upload complete", {politeness: "polite", document})` before mount,
  observe the document for live-region mutations, and then mount the library.
  Assert `"Upload complete"` is inserted once into the polite path and never
  the assertive path, preserving React Aria/Radix replay semantics without a
  public announcer provider.
- [x] `RL-LIFE-03` `[reference]` `[browser]` —
  **ReferenceLibrary should route imperative work through the current host when
  one document host is active.** With one mounted library, invoke untargeted
  `toast.show(Saved, {}, {id: "live"})` and `announce("Saved")`, then invoke
  equivalent calls with `{document}`. Assert the active host contains exactly
  the requested toast instances and one mutation per announcement while no
  sibling root or `document.body` host appears, proving targeted and
  unambiguous untargeted routing converge.
- [x] `RL-LIFE-04` `[reference]` `[browser]` —
  **ReferenceLibrary should pause retained toast time when the only host
  unmounts.** Show `"timer"` with `duration: 5000`, advance 1200ms while it is
  visible, and unmount the only library while recording host nodes and timer
  callbacks. Assert all runtime DOM and listeners are removed and the toast
  retains 3800ms without firing during a 10-second hostless interval, because
  invisible application state must not expire.
- [x] `RL-LIFE-05` `[reference]` `[browser]` —
  **ReferenceLibrary should resume retained and pending work when a document
  host remounts.** During the hostless interval from `RL-LIFE-04`, target the
  same document with a queued 2000ms toast and
  `announce("Connection restored")`, then mount a new library. Assert the
  retained toast resumes with 3800ms, the new toast's timer begins only when it
  becomes visible, and the announcement and each toast render once, proving
  remount is replay rather than duplication or wall-clock expiry.
- [x] `RL-LIFE-06` `[reference]` `[react:all]` —
  **ReferenceLibrary should keep one runtime subscription when StrictMode
  replays mount effects.** In React 17, 18, and 19 fixtures, target the document
  once with toast ID `"strict"` and announcement `"Ready"` before mounting a
  StrictMode library, then force its development setup-cleanup-setup cycle.
  Assert one host, one active subscription, one `"strict"` queue record and
  wrapper, one announcement mutation, and one running timer remain, preventing
  internal effect replay from multiplying document state.

### Configuration

- [x] `RL-CONFIG-01` `[reference]` `[browser]` —
  **ReferenceLibrary should supply library Toast defaults when toaster
  configuration is omitted.** Mount `<ReferenceLibrary>` without `toaster`,
  show five optionless toasts, and inspect their stacks and timers. Assert
  `bottom-end`, 5000ms, and a global visible limit of four while the fifth
  remains outside visual, interactive, and live-region DOM, freezing omission
  separately from falsey values.
- [x] `RL-CONFIG-02` `[reference]` `[browser]` —
  **ReferenceLibrary should apply configured toaster defaults when higher
  precedence options are absent.** Mount with
  `{defaultPosition: "top-start", defaultDuration: 7000, limit: 2}`, define one
  optionless toast and one 3000ms `"bottom-center"` toast, and show instances
  with and without invocation options
  `{duration: 1200, position: "top-end"}`. Assert each option independently
  resolves invocation → definition → ReferenceLibrary, and only two instances
  are visible globally, proving one option never shadows another's
  precedence.
- [x] `RL-CONFIG-03` `[reference]` `[browser]` —
  **ReferenceLibrary should use new defaults only for later resolution when
  configuration changes.** With defaults 5000ms/`"bottom-end"`, show ID
  `"before"`, advance 1000ms, then rerender the same library with
  9000ms/`"top-start"` and show ID `"after"`. Assert `"before"` keeps its DOM
  identity, content, position, and 4000ms remaining while `"after"` receives
  the new values, preventing a configuration rerender from retroactively
  mutating active records.
- [x] `RL-CONFIG-04` `[reference]` `[browser]` —
  **ReferenceLibrary should preserve an untimed default when
  `defaultDuration` is false.** Configure
  `toaster={{defaultDuration: false}}`, show an otherwise optionless toast, and
  advance fake time by 60 seconds through visibility and focus changes. Assert
  no auto-dismiss timer is scheduled and the toast remains until explicit
  dismissal, proving `false` is not coerced to the 5000ms fallback.
- [x] `RL-CONFIG-05` `[reference]` `[browser]` —
  **ReferenceLibrary should honor zero and nonzero Tooltip skip delays when
  neighboring triggers are entered.** With `skipDelay: 0`, open and close
  Tooltip A and immediately enter B; then rerender with `skipDelay: 300`, open
  and close A, and enter B within 299ms and again after 300ms. Assert zero
  always requires B's normal opening delay, whereas 300 makes the within-window
  handoff instant and the later handoff delayed; this ports Radix
  `vendor/radix-primitives/packages/react/tooltip/src/tooltip.test.tsx` “does
  not skip the delay when skipDelayDuration is 0” without adding a Provider.
- [x] `RL-CONFIG-06` `[reference]` `[browser]` —
  **ReferenceLibrary should use the active host's current skip delay when
  configuration rerenders or fails over.** Warm host A with `skipDelay: 600`,
  close its tooltip, advance 50ms, and fail over to standby B configured with
  100ms; in separate runs enter B's neighboring trigger before and after the
  remaining 50ms, then rerender B with zero. Assert the first handoff is
  instant, later handoffs wait normally, and zero disables the retained warm
  interval without duplicating a visible tooltip, proving warm timestamps
  survive while active policy remains authoritative.

### Multiple roots and documents

- [x] `RL-ROOT-01` `[reference]` `[browser]` —
  **ReferenceLibrary should elect only the earliest live mount when one
  document contains multiple React roots.** Mount library A in `#root-a`, then
  library B in `#root-b`, retaining references to both containers. Assert only
  A contains `data-reference-toast-host` and live regions while B renders its
  children unchanged as a standby, freezing election by live mount order
  rather than DOM order.
- [x] `RL-ROOT-02` `[reference]` `[browser]` —
  **ReferenceLibrary should avoid broadcast duplicates when two same-document
  mounts receive global work.** With A active and B standing by, call
  `toast.show(..., {id: "once"})` and `announce("Once")` both untargeted and
  with the shared `document`. Assert one `"once"` visual instance total after
  both upsert requests and one live-region mutation per announce request appear
  only under A, proving mounts do not each subscribe as independent consumers.
- [x] `RL-ROOT-03` `[reference]` `[browser]` —
  **ReferenceLibrary should transfer runtime ownership when the active root
  unmounts.** Show ID `"handoff"` for 5000ms under A, advance 1250ms, and
  unmount A while B remains mounted. Assert A's hosts disappear, B becomes the
  sole host with one `"handoff"` record and 3750ms remaining, and the toast
  expires only after that remainder, proving failover moves state without
  resetting or duplicating timers.
- [x] `RL-ROOT-04` `[reference]` `[browser]` —
  **ReferenceLibrary should keep a remounted former host on standby when a
  successor is active.** After `RL-ROOT-03` elects B, remount a new library in
  `#root-a` and show ID `"after-remount"`. Assert B remains the only runtime
  host and renders the toast once while A renders only its application
  children, preventing historical priority from stealing a live election.
- [x] `RL-ROOT-05` `[reference]` `[browser]` —
  **ReferenceLibrary should deduplicate nested mounts when one React root
  contains multiple libraries.** Render outer library A around ordinary
  `<main>` content and nested library B, show a toast, then remove A while
  retaining B and the content. Assert one host exists before and after
  failover, the toast and its remaining timer survive once, and the `<main>`
  parentage and identity stay unchanged, proving nesting is not context
  scoping.
- [x] `RL-ROOT-06` `[reference]` `[shadow]` —
  **ReferenceLibrary should keep host DOM inside a ShadowRoot when that mount
  wins document election.** Attach an open ShadowRoot, mount the first library
  into its React container, and invoke `toast.show` and `announce` for the
  owner `document`. Assert visual and live-region nodes are descendants of the
  ShadowRoot container and absent from light DOM while the global calls still
  resolve the active mount, preserving React-root ownership across a shadow
  boundary.
- [x] `RL-ROOT-07` `[reference]` `[browser]` —
  **ReferenceLibrary should isolate host election when libraries belong to
  different Documents.** Mount one library in the top document and one in a
  same-origin iframe document, then target each with distinct toast IDs and
  announcement strings. Assert each document owns one independent host and
  contains only its own visual/live content, with no node adopted or inserted
  across documents.
- [x] `RL-ROOT-08` `[reference]` `[browser]` —
  **ReferenceLibrary should reject ambiguous global routing when multiple
  Documents are eligible.** With active hosts in the top document and iframe,
  target show/update/dismiss/dismiss-all/announce operations at each
  `Document`, then repeat every operation without `document`. Assert targeted
  operations mutate only the named host, the same ID may remain independent,
  and every untargeted operation emits one development ambiguity diagnostic
  while mutating neither document, preventing mount order from becoming an
  implicit cross-document API.

### Tooltip warmup ownership

- [x] `RL-TIP-01` `[convergence]` `[browser]` —
  **ReferenceLibrary should record document warmth when one Tooltip reaches
  open.** Mount sibling Tooltip triggers under ordinary application DOM with a
  300ms skip delay, open A through its normal delay, close it, and enter B
  before 300ms elapses. Assert B opens immediately with no public Tooltip
  Provider or descendant dependency, converging Radix `skipDelayDuration`,
  React Aria `globalWarmedUp`, Zag `setGlobalId`, and Floating UI delay-group
  behavior at the document runtime.
- [x] `RL-TIP-02` `[reference]` `[browser]` —
  **ReferenceLibrary should preserve one warm Tooltip handoff when its active
  host fails over.** Open and close Tooltip A under host A with
  `skipDelay: 300`, advance 100ms, unmount A so B becomes active, and enter
  Tooltip B before the remaining 200ms expires. Assert B uses the warm path,
  only B is visible, and the window still closes at the original deadline
  rather than restarting on failover.
- [x] `RL-TIP-03` `[reference]` `[browser]` —
  **ReferenceLibrary should keep Tooltip warmth document-local when two
  Documents have hosts.** Warm a Tooltip in the top document, then immediately
  enter a cold Tooltip in a same-origin iframe whose library also uses
  `skipDelay: 300`. Assert the iframe Tooltip waits its normal opening delay
  while a top-document neighbor opens instantly, proving warm timestamps and
  listeners never cross `Document` ownership.
- [x] `RL-TIP-04` `[reference]` `[browser]` —
  **ReferenceLibrary should discard Tooltip warmth when a document loses every
  host.** Warm the document, unmount its active and standby libraries, advance
  beyond all pending skip timers, and mount a fresh library before entering a
  trigger. Assert old timers/listeners are absent and the first Tooltip waits
  its normal delay, proving a later mount cannot inherit orphaned global warm
  state.

### SSR and hydration

- [x] `RL-ENV-01` `[reference]` `[ssr]` —
  **ReferenceLibrary should server-render only its children when no DOM runtime
  exists.** In a Node request with throwing `window`/`document` getters and
  spies on timer creation, render a library containing
  `<main id="ssr">Hello</main>` to HTML. Assert the child markup is emitted
  without host/live-region markup, DOM access, timers, listeners, or
  module-level nodes, keeping request rendering side-effect free.
- [x] `RL-ENV-02` `[reference]` `[ssr]` —
  **ReferenceLibrary should elect one client host when server markup hydrates.**
  Hydrate server output containing two same-document library mounts while
  collecting `onRecoverableError` and console hydration warnings. Assert
  child markup and IDs match, the earliest live mount creates exactly one host
  after activation, and no duplicate live regions or mismatch diagnostics
  occur.
- [x] `RL-ENV-03` `[reference]` `[ssr]` —
  **ReferenceLibrary should reveal a browser-queued toast only when hydration
  activates its host.** Load server-rendered child markup with no runtime DOM,
  call `toast.show(..., {id: "hydrate", document})` in the browser before
  `hydrateRoot`, and then hydrate ReferenceLibrary. Assert `"hydrate"` was
  absent from server HTML and appears once after host activation with its
  original options and full visible duration, distinguishing browser
  pre-hydration replay from request-safe server no-ops.

## Composition gates

- [x] `RL-COMP-01` `[reference]` `[browser]` —
  **ReferenceLibrary should coordinate Toast and announce when one application
  root owns the document runtime.** Build one root that shows a custom timed
  toast and sends a separate polite message, then update and dismiss the toast.
  Assert one in-root visual host and separate live-region path receive the
  operations without changing application DOM, covering the ordinary
  composition while Toast retains queue/content ownership.
- [x] `RL-COMP-02` `[reference]` `[browser]` —
  **ReferenceLibrary should preserve runtime work when two microfrontend roots
  exchange active-host ownership.** Mount independently managed roots A and B,
  start a timed toast and announcement through A, and unmount A while B stays
  live and later A remounts. Assert B alone takes over the queue, remaining
  time, and future announcements and the remounted A stays standby, covering
  cross-root failover without a shared React context.
- [x] `RL-COMP-03` `[reference]` `[shadow]` —
  **ReferenceLibrary should retain root ownership when a ShadowRoot uses
  Tooltip warmth and Toast together.** Mount the elected library and sibling
  Tooltip triggers inside a ShadowRoot, warm one trigger, hand off to the
  other, and show a targeted toast from light-DOM application code. Assert the
  Tooltip handoff and visual/live toast DOM remain inside the elected shadow
  React root with one document runtime, covering shadow composition without a
  Portal or public Provider.

Toast owns queue/content/timer assertions. Tooltip owns open/close and
skip-delay interaction assertions. This spec proves only mount, deduplication,
configuration, and failover.

## Out of scope

- Layer stack, FocusLock, scroll lock, inerting, or overlay providers.
- A public Tooltip Provider, toaster context, or runtime instance passed
  through descendants.
