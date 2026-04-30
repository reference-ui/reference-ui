# Apply Responsive Styles

This transform lowers Reference UI responsive `r` sugar after imports have already been retargeted to canonical `css()` / `cva()` call sites.

It stays isolated because it depends on seeing the final Panda-facing runtime shape rather than the author-facing `@reference-ui/react` form.