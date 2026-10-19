# CORE-COND-16 — css()-nested `&:where(:has())` collapses icon-only buttons

The world styles an icon-only button and a text button with one class
carrying `paddingInline: '20px'` plus the `&:where(:has(...))` collapse
to `'0'` (the lib button source verbatim). The spec checks the sheet carries
the bare utility and the substituted `:where(:has(...))` rule, the
icon-only button paints `0px`, and the text button keeps `20px`. The
frozen-request recompile carries zero diagnostics.

Evidence: ATM-COND-22; Panda v2 nested-selector parity tests.

> Search terms: where has, icon-only button, functional pseudo, nested selector, collapse
