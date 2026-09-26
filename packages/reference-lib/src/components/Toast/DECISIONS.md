# Toast decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: imperative queue + host + live-region runtime for transient notifications.

## Landed (context, 2-4 lines)

No quarantine freeze commit exists for Toast and no landing crew was
assigned — there is no crew log and no landing commit; Toast/ has an
empty quarantine diffstat (see recon §3 component list, which has no
Toast row). Adjacent proof only: Overlay crew verified Toast's Overlay
contracts unchanged, Presence crew verified ToastSystem (sole in-repo
`usePresence` consumer) unaffected, Announcer crew ran Toast unit 52/52 green.

## Candidate features (quarantine-sourced)

None — quarantine has no Toast freeze commit and an empty Toast/
diffstat, so it surfaced zero candidate APIs.

## Suspected gaps (no quarantine source)

None evidenced — SPEC.md records Defects: none and Remaining: none
(all 105 contract IDs `[x]`), and every sibling handoff touching Toast
(Overlay contracts, Presence `usePresence`, Announcer live region)
confirms compatibility with zero action items.

## Non-decisions (rejected outright)

- Sonner stylesheet/chrome copy — deliberately not ported ([Toast.md](./Toast.md) "Leave", SPEC.md "no copied `sonner/styles.css`").
- Public `Toast.Provider` — rejected; one host mounted by `ReferenceLibrary` ([Toast.md](./Toast.md) Convergence).
- `toasterId` / multiple toasters — rejected; one host per document, six positions (SPEC.md Runtime freeze 1).
- Semantic `success`/`error`/etc. as library visual variants — rejected; typed shortcuts over `define()`, chrome stays in `render` ([Toast.md](./Toast.md) "Leave").
- Sonner `visibleToasts` hidden-but-expiring limit — rejected; FIFO waiting queue, excess unmounted and untimed (SPEC.md "Keep").
- Spectrum NVDA `aria-hidden` workaround — deliberately not ported; announcements use a separately mounted live region ([Toast.md](./Toast.md) "Announce vs visual").

## Walkthrough notes for HQ

- There is nothing to decide: Toast is fully frozen (105/105 IDs proven) with no quarantine-sourced candidates and no evidenced gaps.
- Try Book `Toast → Basic`: show a toast, hover to pause, watch remaining-time resume — the FIFO + pause contracts in one glance.
- The six non-decisions above are the design spine (FIFO limit, one host, announce off the card); breaking any one reopens a Sonner bug the freeze exists to prevent.
