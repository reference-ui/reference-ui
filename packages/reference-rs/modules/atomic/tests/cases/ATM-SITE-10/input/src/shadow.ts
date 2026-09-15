import { css, recipe } from '@reference-ui/react'

css({ color: 'blue' })
css.object({ display: 'flex' })
recipe({ base: { fontWeight: 'bold' } })

function f(css: (styles: object) => object) {
  css({ color: 'red' })
}

function g(recipe: (config: object) => object) {
  recipe({ base: { p: '1r' } })
}

function h() {
  const css = (styles: object) => styles
  css({ bg: 'n300' })
}

const localCss = (styles: object) => styles
localCss({ mt: '2r' })

void f
void g
void h
