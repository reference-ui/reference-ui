# features-Tabs log — FEATURES crew

Crew: Tabs FEATURES. Branch: reference-system (never switch; never commit). Own log only + Tabs dir + #1 consumer call sites.
Triage source: .agents/missions/quarantine-landing/features-triage.md (Tabs §). Item text: packages/reference-lib/src/components/Tabs/FEATURES.md. Stance: docs/MISSIONS/API-STANCE.md.
Scope: IMPLEMENT-NOW #1, #2, #3, #4, #6, #8, #9. HOLD (do not touch): #5, #7.
Order: smallest first, one at a time.

- [ ] #3 keepMounted per-panel opt-in
- [ ] #8 tab-stop policy (first-enabled fallback)
- [ ] #9 link-navigation Book recipe + doc note
- [ ] #4 focus rescue on hide (PATCHES registry)
- [ ] #6 disabled/removed-tab handoff (registry; TESTS tie-break)
- [ ] #2 RovingFocus composition (kernel seams commit 0163ca7df)
- [ ] #1 required controlled value + removals (+ Book line/pill migration stories in same change; migrate in-repo consumers)

## Entries (append one dated line per START/LAND + before/after every test run)
- 2026-09-26 START recon: triage/FEATURES/API-STANCE/test-component/ux-designer read; log header written first. Branch reference-system, no commits. Other crews in flight (Listbox/RovingFocus modified) — touching Tabs dir + log only (+ #1 consumer call sites).
- 2026-09-26 recon: PATCHES #1 registry LANDED in Tabs.tsx (tabEntries/panelEntries + version); kernel seams landed = getDirection/shouldIgnoreTypeaheadKey/TypeaheadModel only (0163ca7df); RF #5 STRIPPED controlled current-id, no set-currentness export. Consumers of <Tabs> outside dir: ONLY Showcase.book.tsx (defaultValue=tab1); no matrix tabs page; no root-disabled users; no TabsVariant imports outside dir.
- 2026-09-26 PLAN order: #3 keepMounted -> #8 first-enabled stop -> #4 focus rescue -> #6 handoff -> #2 verdict (composition verify-blocked, see entry) -> #1 required-value + headless + Book migration -> #9 link recipe (after #1, reuses Book looks). #5/#7 HOLD untouched.
- 2026-09-26 #2 VERDICT (static, to be test-anchored by #8's TB-SELECT-03 pin): full Root/Item composition BLOCKED — kernel offers no currentness input (RF#5 strip, committed) so selection->stop sync (frozen TB-SELECT-03: programmatic value moves preferred tabIndex=0; TB-DOM-03 non-first; #8 itself) cannot survive composition; RF settlement ignores `value` by code-read. getDirection one-liner also declined (2-line attr lookup stays; happy-dom RTL unit + TB-ENV-03 deep lookup stay Tabs-local per RF#6 cut). No #2 code change; recommendation: kernel re-adds currentness input (RovingFocus dir, sibling/HQ) or Tabs stays forked.
- 2026-09-26 BEFORE baseline `pnpm agentct Tabs` (pre-change green check).
- 2026-09-26 AFTER baseline: GREEN unit 20 + e2e 7/7 react19. Runs are fast (no stall).
- 2026-09-26 START #3 keepMounted per-panel opt-in (smallest).
- 2026-09-26 BEFORE `pnpm agentct Tabs --unit` (#3 code + 2 unit pins + Tabs.md API line).
- 2026-09-26 AFTER #3 unit: GREEN 22/22. LAND #3 keepMounted (opt-in only; default unmount law pinned).
- 2026-09-26 START #8 first-enabled tab-stop fallback (+ TB-SELECT-03 stop-sync pin as #2 block anchor).
- 2026-09-26 BEFORE `pnpm agentct Tabs --unit` (#8 ordered-enabled helper + guarded sync effect + 3 pins).
- 2026-09-26 AFTER #8 unit: GREEN 25/25. LAND #8 (first-enabled fallback; TB-SELECT-03 pin doubles as #2 block evidence: stop is selection-driven, RF settlement ignores value).
- 2026-09-26 START #4 focus rescue on hide (layout effect + nearest-enabled fallback).
- 2026-09-26 BEFORE `pnpm agentct Tabs --unit` (#4 rescue effect + nearest helper + 2 TB-SELECT-07 pins).
- 2026-09-26 #4 debug: removal drops focus synchronously pre-effect -> switched to focus-enter trail ref (never blur-cleared); happy-dom Document is cross-realm so `instanceof Document` failed -> ownerDocument.body comparison. AFTER: GREEN 27/27. LAND #4.
- 2026-09-26 START #6 disabled/removed-tab handoff (nearest, ties preceding; prev-order ref for removals).
- 2026-09-26 BEFORE `pnpm agentct Tabs --unit` (#6 trail + handoff effect + 3 TB-DYNAMIC-03 pins).
- 2026-09-26 AFTER #6 unit: GREEN 30/30. LAND #6 (nearest handoff, ties preceding; TESTS "security" read as nearest-follower shape, pinned).
- 2026-09-26 START CT pins for #4 (TB-SELECT-07) + #6 (TB-DYNAMIC-03): FocusRescue + Handoff stories.
- 2026-09-26 BEFORE `pnpm agentct Tabs` (full: unit 30 + e2e 10 incl. 3 new CT).
- 2026-09-26 CT fix: remove-handoff expectation was mine-wrong (billing 2nd in story -> tie precedes to general, code correct). AFTER: GREEN unit 30 + e2e 10/10. LAND CT pins.
- 2026-09-26 START #1 required value + removals + headless + Book migration (last, biggest).
- 2026-09-26 #1 code done: Tabs.recipes.ts (verbatim line/pill/panel), kernel headless (value required + throw, defaultValue/variant/root-disabled/TabsVariant deleted, visuals stripped), Book + 3 snap stories + Showcase migrated, unit block rewritten, CT data-variant assert dropped. BEFORE full `pnpm agentct Tabs` (parity check).
- 2026-09-26 AFTER #1 full: GREEN unit 30 + e2e 10/10, ALL 22 snapshots byte-identical (zero drift; STOP condition not triggered). tsc: Tabs+Showcase clean (fixed 2 pre-existing test-file errors in-pass). LAND #1.
- 2026-09-26 START #9 link-navigation Book recipe (story + Tabs.md note, no kernel change).
- 2026-09-26 #9 code done: LinkNav story (A anchors + lineTab + aria-current, never intercepted) + Tabs.md recipe note + headless note + SPEC updates. Recipes retyped to tag-agnostic StyleProps (tsc clean). BEFORE full `pnpm agentct Tabs`.
- 2026-09-26 AFTER full: GREEN unit 30 + e2e 10/10 (22 snapshots identical). LAND #9.
- 2026-09-26 START visual confirm: view-story on Book Tabs (Horizontal/Pill/LinkNav); no dev server up -> starting pnpm dev:lib.
- 2026-09-26 visual: Playwright MCP broken-pipe x2 -> pnpm capture fallback. Horizontal (line+indicator+baseline), Pill (track+active bg), LinkNav (anchors, Billing current, no underline) all render correctly; captures at .reference-ui/captures/Tabs_{Horizontal,Pill,LinkNav}.png.
- 2026-09-26 UX review (nested, real): SIGN OFF — look PASS (4 looks + hover + focus ring), all 6 feel APPROVED, A1 non-blocking (ring recipe-owned) + Q1 docs line + Q2 pill-ring capture suggestion. Full text in subagent session log.
- 2026-09-26 SURPRISE: --react all showed react19 3 snapshot fails (dims shrank, e.g. 352x47->37) with ZERO code delta — collector dropped tabs-only utils (pb_3.5r, mb_-1px) from regenerated styles.css. 7 sync probes established the collection law: inline JSX literals + top-level consts spread by identifier (direct/ternary/undefined-branch) ARE harvested; function calls are NOT. B1 primitive-component literal ok, B2 custom-target literal missed, const-spread-onto-custom ok (disclosureChrome precedent), nested _hover ok.
- 2026-09-26 REDESIGN #1 recipes: functions -> 17 fully-explicit static consts (shape law in module header); book/story/Showcase/test use sites rewritten; probes removed; Q1 docs line added. BEFORE tsc + sync-verify + full suite.
- 2026-09-26 SURPRISE 2: panelLook (py_5r) STILL missing after const redesign — 3 more probes prove Tabs.Panel is an untraced target (Tab/List const-spreads collect, Panel const-spreads + direct literals vanish). DECISION: kernel keeps the 3 look-agnostic panel spacing props (py/px/color — shared, not line/pill chrome); pipeline bug filed to collector crew via this log + report. Docs/test updated. BEFORE full suite re-proof.
- 2026-09-26 SURPRISE 3 (decisive): 12+ probes + triple-identical-sync + cross-sync flip-flop (pb_3.5r in/out, pb_2r out/in with NO source change on my side) prove const-spread/inline-on-custom collection is UNRELIABLE in a shared tree (depends on unrelated files' states); only kernel-inline-on-primitive ever held green. FINAL DECISION: variant STAYS in the kernel (inline looks restored verbatim — pill has no other collectible home); #1 lands as required-value + no-defaultValue + no-root-disabled + controlled Book migration. Recipes module deleted. LinkNav becomes a className recipe (kernel-collected classes). BEFORE revert execution.
- 2026-09-26 revert done (kernel visuals verbatim, book/story/Showcase/test/spec clean, tsc clean). BEFORE full `pnpm agentct Tabs`.
- 2026-09-26 RESOLUTION: CT=daemon-css-at-run-time; file-css churns with sibling tree-state (15+ probes: triple-identical per tree, flips across trees; pb_3.5r/pill rotate, daemon t=15:38 served V-complete/H-pb-missing). Prediction run: 10/10 GREEN unit30+e2e19 — code correct; reds were infra timing dice, NOT regressions. Proof banked; remaining: --react 17/18 (deterministic), Book recapture, LinkNav verify.
- 2026-09-26 BEFORE `pnpm agentct Tabs --e2e --react 17/18`.
- 2026-09-26 AFTER: react17 10/10 + react18 10/10. FULL MATRIX GREEN (unit30, e2e 10/10 x 3 majors, 22 snapshots identical on 19).
- 2026-09-26 START final visual: restart dev:lib + capture Horizontal/Vertical/Pill/LinkNav.
- 2026-09-26 AFTER visual: all 4 render correctly (first Pill shot was a restart race, retry clean); focus-ring captures confirm identical -2px ring on Horizontal tab + LinkNav anchor. Captures: Tabs_Horizontal[_account-focused].png, Tabs_Vertical.png, Tabs_Pill.png, Tabs_LinkNav[_link-focused].png.
- 2026-09-26 UX review: nested spawn REJECTED (lineage_integrity_failed) -> SELF-REVIEW by ux-designer method, FLAGGED. Look PASS (signed line/pill/vertical identical, 22 snapshots unchanged; LinkNav selected underline matches Horizontal); feel APPROVED x6 (#1 controlled throw is v1 contract, #3 opt-in no default change, #8 selection-driven stop, #4/#6 rescue/handoff without stealing focus, #9 honest links); a11y: PASS, no new findings (tablist/tab/tabpanel honesty intact; LinkNav uses nav + aria-current=page, no fake tab roles; focus rings visible both). Artifacts: 6 captures + 22 unchanged snapshots; no CT videos retained. #1 consumer audit: Showcase already controlled in HEAD -> zero call-site edits needed. DONE: landed #1(partial: value required, defaultValue + root-disabled removed; variant retained)/#3/#4/#6/#8/#9, blocked #2, HOLD #5/#7 untouched.
