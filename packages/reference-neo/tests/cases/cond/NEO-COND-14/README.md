# NEO-COND-14 — `_placeholder`, `_file`, `_checked` use the lib twin lists

The world styles a text input's placeholder, a file input's button, and a
checked checkbox plus a `data-state="checked"` twin. The spec checks the
sheet pairs `::placeholder` with `[data-placeholder]`, lowers `_file` to
`::file-selector-button`, twins `_checked` four ways, and each probe paints.

Evidence: `[lib]` styles-css L538 twin lists, `::file-selector-button` ×3;
`[atm]` ATM-COND-18 (RS-17 landed).
