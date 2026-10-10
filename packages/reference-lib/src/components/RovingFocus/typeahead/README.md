# typeahead

Buffer search over the live collection. The model owns the query buffer,
the 1000ms idle timer, same-letter cycling, and Unicode prefix matching;
the guards keep modified, composing, and editable-targeted keys out of the
buffer; label derivation resolves each item's match string from textValue,
aria-label, or cleaned rendered text. The model and guards are public
convergence seams — Tree and Combobox run their own sessions through them —
so their contracts are pinned here in isolation, not just through the
component.
