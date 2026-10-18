# CORE-TOKEN-05 — { light, dark } leaves paint as data-color-mode islands on html and nested scopes

The world declares one `brand` token with `light`/`dark` leaves and paints
two probes with it: one under `html`, one inside a nested
`[data-color-mode=dark]` island. The spec checks the sheet carries the
`:root,[data-color-mode=light]` / `[data-color-mode=dark]` islands with the
brand var in each, then flips the attribute on `html` and on the nested
island and asserts computed colour each time.

Evidence: ATM-COND-03/08; reference-lib light/dark islands;
Panda v1 generate-token tests (contrast:
`:where([data-theme=dark], .dark)`).

> Search terms: theming, prefers-color-scheme, day/night, appearance, token/color-mode, CORE-TOKEN-14, ATM-COND-08
