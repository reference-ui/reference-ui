# RovingFocus patches — mechanical, test-pinnable today

Companion to `DECISIONS.md`. Every item here is fully specified: no product,
UX, or API-design call needed — a test could pin it today. These are the
likely-to-do items.

### 1. Capture-phase Space typeahead guard (from DECISIONS candidate #4)

- **What:** when `typeahead` is on and the search buffer is nonempty, Space is captured before button activation, appended to the buffer, and matched; neither the original nor the matched button activates.
- **Acceptance:** RF-TYPE-06 passes as a CT browser case on react19 (space-containing label matched, zero activations).
- **Source:** quarantine `088e4a70c` `RovingFocus.tsx` `handleKeyDownCapture`; full context in `DECISIONS.md` candidate 4.
