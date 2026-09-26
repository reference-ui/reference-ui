# Combobox patches (mechanical backlog)

Fully specified items a test can pin today — parity proofs and audit checks with no API or behavior design needed. Sourced from DECISIONS suspected gaps.

### 1. ShadowRoot contract + cross-engine parity (from DECISIONS gap #3)
- What: Portal into the focus source's containing open ShadowRoot with composed inside/outside paths and identical callback order across Chromium/Firefox/WebKit.
- Acceptance: CB-ENV-03 and CB-ENV-04 pass in the matrix CT harness (shadow fixtures plus Firefox/WebKit runs), allowing only documented native text differences.
- Source: TESTS.md `CB-ENV-03`, `CB-ENV-04`; DECISIONS gap #3.

### 2. Single layer + single dismissal sequence (from DECISIONS gap #4)
- What: One popover yields exactly one layer registration and one granular-before-high-level dismissal sequence, shared with Popover positioning.
- Acceptance: CB-CLOSE-03 passes against Overlay layer/dismissal accounting — one layer entry, one ordered sequence, one positioned popover, no double-registered event.
- Source: TESTS.md `CB-CLOSE-03`; DECISIONS gap #4.
