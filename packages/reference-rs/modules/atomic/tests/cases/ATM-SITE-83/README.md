# ATM-SITE-83

A spread bag on a JSX host has attribute semantics: `css` and `r` recurse like their attribute spellings, style and condition keys extract, and `style`, `data-*`, handlers, and class names stay silent — while `css()` keeps style-object semantics and still warns on `css: 1`.
Symbols: `BagSemantics`, `ObjectWalk`, `walk_css_value`, `walk_r_value`, `lower_css_entry`, `lower_r_entry`.
Siblings: `ATM-SITE-07`/`ATM-SITE-08` (DOM namespace), `ATM-COND-07` (r queries), `ATM-SITE-81` (recorded bags).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: spread bag, JSX attributes, css prop, r prop, UnknownProperty, style prop, host keys, bag semantics
