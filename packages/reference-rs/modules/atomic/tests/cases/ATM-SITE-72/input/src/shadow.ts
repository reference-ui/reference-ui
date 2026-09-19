import { css } from '@reference-ui/react'

// Live top-level call beside the shadows.
css({ color: 'blue' })

// Arrow-function param named `css` shadows the import (v2 `scope.rs:707`).
const f = (css: (styles: object) => object) => css({ color: 'red' })

// Function-declaration twin of the same shadow (v2 `scope.rs:690`).
function g(css: (styles: object) => object) {
  css({ color: 'green' })
}

void f
void g
