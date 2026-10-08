import { css } from '@reference-ui/react'

export const bemElem = css({ '&_elem': { color: 'red.500' } })
export const ancestorPseudo = css({ 'body &:hover b': { color: 'blue.500' } })
export const tailThreeLevels = css({
  '&:hover': { '& .b': { '.c &': { color: 'green.500' } } },
})
export const tagSuffix = css({ '&html': { color: 'amber.500' } })
export const tagPrefix = css({ 'html&': { color: 'violet.500' } })
export const tagList = css({ '&h1, &h2': { color: 'cyan.500' } })
export const hostFn = css({ '&(:focus)': { color: 'pink.500' } })
export const combinatorList = css({ '&+.baz, &.qux': { color: 'orange.500' } })
export const childTight = css({ '&>.bar': { color: 'lime.500' } })
export const bodySuffix = css({ 'body&': { color: 'teal.500' } })
export const classSuffix = css({ '.foo&': { color: 'indigo.500' } })
export const bareAmp = css({ '&': { color: 'purple.500' } })
export const plainControl = css({ color: 'purple.500' })
