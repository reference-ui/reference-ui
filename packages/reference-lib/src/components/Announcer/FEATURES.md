# Announcer features (need design)

Source: `DECISIONS.md` OPEN/DEFERRED items needing a product/UX/design call before implementation.

### 1. Dedicated Announcer Book story (from DECISIONS candidate #1)

- **What it does:** interactive Book demo — "Announce Polite" / "Announce Assertive" buttons plus a visible last-spoken readout — for manual and AT verification of the invisible runtime.
- **API:** a `.story.tsx` rendering `<ReferenceLibrary>` + the two buttons + readout (quarantine's `.book.tsx` `Default` is the stale-convention sketch); open whether the story exposes region text visibly or stays pure.
- **Maintainer take:** weak yes only if manual AT verification needs a click target — riding the ReferenceLibrary/Toast stories is enough otherwise.

### 2. Public export freeze (from DECISIONS candidate #2)

- **What it does:** narrows the public surface to `announce` + `AnnounceOptions` (plus types) so applications can no longer mount a second `AnnouncerHost` and double-speak.
- **API:** `index.ts` keeps `announce` + `AnnounceOptions`; `AnnouncerHost`, `getAnnouncerSnapshot`, `ANNOUNCE_CLEAR_DELAY`, `MAX_PENDING_ANNOUNCEMENTS`, `register/unregisterAnnouncerDocument`, `announcerDiagnostic`, `resolveAnnouncerDocument`, `getAnnouncerStore` move to an internal/test-only entry (SPEC defect 4).
- **Maintainer take:** yes before production, paired with a consumer audit (Toast, matrix fixtures, `getAnnouncerSnapshot` probes).

### 3. Product path for multi-document hosts (from DECISIONS gap #5)

- **What it does:** settles the supported iframe/Shadow-document topology: ReferenceLibrary-per-document vs blessed `<AnnouncerHost document>` mounts.
- **API:** either (a) document ReferenceLibrary-per-document as the product topology with direct mount test-only, or (b) bless `<AnnouncerHost document={doc}>` as the supported recipe (interacts with the export freeze).
- **Maintainer take:** must decide when test-core re-targets `announcer.spec.ts` — lean (a) unless iframe consumers need the direct recipe.
