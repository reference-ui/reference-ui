# Announcer features (need design)

Open and deferred items that need a product, UX, or design call before implementation.

### 1. Dedicated Announcer Book story

- **What it does:** interactive Book demo — "Announce Polite" / "Announce Assertive" buttons plus a visible last-spoken readout — for manual and AT verification of the invisible runtime.
- **API:** a `.story.tsx` rendering `<ReferenceLibrary>` + the two buttons + readout (the existing `.book.tsx` `Default` sketch uses a stale convention); open whether the story exposes region text visibly or stays pure.
- **Recommendation:** Weak yes only if manual AT verification needs a click target — riding the ReferenceLibrary/Toast stories is enough otherwise.

### 2. Public export freeze

- **What it does:** narrows the public surface to `announce` + `AnnounceOptions` (plus types) so applications can no longer mount a second `AnnouncerHost` and double-speak.
- **API:** `index.ts` keeps `announce` + `AnnounceOptions`; `AnnouncerHost`, `getAnnouncerSnapshot`, `ANNOUNCE_CLEAR_DELAY`, `MAX_PENDING_ANNOUNCEMENTS`, `register/unregisterAnnouncerDocument`, `announcerDiagnostic`, `resolveAnnouncerDocument`, `getAnnouncerStore` move to an internal/test-only entry (SPEC defect 4).
- **Recommendation:** Yes before production, paired with a consumer audit (Toast, matrix fixtures, `getAnnouncerSnapshot` probes).

### 3. Product path for multi-document hosts

- **What it does:** settles the supported iframe/Shadow-document topology: ReferenceLibrary-per-document vs blessed `<AnnouncerHost document>` mounts.
- **API:** either (a) document ReferenceLibrary-per-document as the product topology with direct mount test-only, or (b) bless `<AnnouncerHost document={doc}>` as the supported recipe (interacts with the export freeze).
- **Recommendation:** Must decide when test-core re-targets `announcer.spec.ts` — lean (a) unless iframe consumers need the direct recipe.
