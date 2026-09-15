# Extract / css

Finds `css()` / `css.object()` calls and hands their arguments to
`extract/expressions`. The callee must be a Reference import (or the
compiler alias `__reference_ui_css`), not a shadowed local or unknown
helper named `css`.

```ts
import { css } from '@reference-ui/react'
css({ mt: '2r', _hover: { bg: 'n300' } })
css.object({ p: '1r' })
```

`function f(css) { css({ color: 'red' }) }` is not a site.

## Must not

- Choose values (expressions).
- Extract `sva` / `cva` / unknown helpers.
- Match the identifier `css` without an import binding.
