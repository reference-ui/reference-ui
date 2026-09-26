# Menu P3 remainder crew log

Branch: reference-system (never switch; never commit).
Scope: packages/reference-lib/src/components/Menu/* + this log ONLY. Read-only elsewhere (Overlay/Popover read-only).
Contract: (1) FLAG-FLIP per FLAG comments (haspopup menu-correct via committed Popover seam f738d6060); (2) P-#3 SHADOW assess vs current tree, land EXACTLY as written if mechanical else re-verify-block. Visuals frozen (snapshots unmodified; STOP+flag if visual change required). Proof: pnpm agentct Menu (test-component skill). UX: nested ux-designer review.
Parent context: Menu A+B committed underneath (5e630106a FEATURES-B: nested submenus + LinkItem). Overlay FEATURES #1 (automatic getRootNode) LANDED in-tree uncommitted (portal-container.ts + Content/Backdrop wiring, OV-ENV-05 proof).

## Timeline
- START header written
- RECON done (API-STANCE, both skills, Popover seam f738d6060, Overlay FEATURES #1 portal-container.ts + OV-ENV-05, CB-ENV-03 + DF-COMP-04 consumer-shadow precedent, DateField P2shadow log, Menu.tsx full read, 5 FLAG sites)
- TASK1 CONTENT DECISION: Popover.Content role stays default dialog; Menu's own div carries role=menu (nested parts already menu-correct); the a11y FAIL was haspopup-only, FLAGs are haspopup-only, B12 UX passed a11y with wrapper as-is. No content-role change = minimal, no AT-risk invention.
- TASK1 LANDED: EntryTrigger aria-haspopup="menu" default (still consumer-overridable) in story/test/book + 5 assertions flipped dialog->menu, FLAG comments removed. Zero FLAGs remain in Menu dir.
- TASK2 VERDICT: MECHANICAL LAND (not test-only): Overlay destination rule is automatic and inherited, but Menu-owned seams need owning-root adoption: (1) unwindForPress takes retargeted event.target (single caller Menu.tsx:654) -> composed-path containment via Overlay-exported eventPath; (2) MenuTrigger layout fallback document.getElementById nulls triggerRef in shadow on ALL React versions (overwrites the 19 composedRef!) -> owning-root getElementById; (3) wasOpen restore gates use document.activeElement (retargeted to host) -> owning-root activeElement. Tab traversal stays document-scoped (Tree-deferred precedent, not in MN-ENV-03 text).
- BEFORE pnpm agentct Menu (task1 proof)
- AFTER task1: E2E 49/49 + Unit 18/18 green, React 19, snapshots unmodified
- TASK2 test written: Shadow story (shadow-host + createPortal inner, CB-ENV-03/OV-ENV-05 mirror; inert inside-pad with inline style since compiled classes don't pierce shadow) + MN-ENV-03 CT (destination, owning-root focus/typeahead, submenu inheritance, composed-inside x2, Left-restore, outside-once-deepest-first, cleanup, reopen). No snapshots (behavioral only).
- BEFORE MN-ENV-03 single (honest-red check): RED at line 1183 as predicted (submenu content portalled to body: triggerRef nulled by document.getElementById fallback). Root destination/focus/typeahead passed pre-fix.
- TASK2 ADOPTION landed in Menu.tsx: (1) unwindForPress(event) + Overlay isEventInside composed-path containment (single caller); nodeContains removed; (2) MenuTrigger id resolution via owningScope(parent content) with ShadowRoot guards; (3) wasOpen restore gates via activeElementIn. findNextTabbable untouched (Tab traversal deferred, Tree precedent).
- AFTER MN-ENV-03 single: PASSED react19 (702ms)
- SPEC.md MN-ENV-03 ticked [x] with scoping note
- BEFORE full pnpm agentct Menu (both-tasks proof)
- AFTER full: E2E 50/50 + Unit 18/18 green React 19, snapshots unmodified; tsc zero Menu errors
- AFTER --react all: 17: 50/50, 18: 50/50, 19: 42/50 (8 transient, known daemon-contention flake per B10/B11); isolated 19 rerun: 50/50. Combined: all majors green.
- ARTIFACTS: MN-ENV-03 video.webm not renderable in-tool (binary refs unsupported); judged via test-finished-1.png (end state matches spec asserts exactly: Action Edit, 3 onOpen/onDismiss pairs, root logs true,false,true,false). No motion changes made (zero render-output delta).
- SCOPE CHECK: 6 Menu files M (book/story/test/Menu.tsx/SPEC/CT) + this log; snapshots git-clean; no commits made.
- NESTED UX REVIEW (child 01a0ded4): APPROVE. Look APPROVED (nothing moved; 7 Book captures); Feel APPROVED all areas (root open/close, submenu open, level-local close, tree unwind, focus restore every path incl. shadow, MN-ENV-03 re-ran 1/1); A11y: #4 haspopup FAIL CLOSED (live trigger reads haspopup=menu; seam verified both directions), nested roles honest; residual non-blocking pre-existing: Popover.Content wrapper still role=dialog (unchanged by delta, carried for Popover crew).
- COMPLETE: both tasks LANDED. Never switched branches; never committed.
