import { css } from '@reference-ui/react'

// docs/css.mdx: null, false and undefined values inside an object are skipped.
// Expected: all five calls typecheck, and the later skipped values keep 20px.
export const nullValue = css({ padding: '20px' }, { padding: null })
export const falseValue = css({ padding: '20px' }, { padding: false })
export const undefinedValue = css({ padding: '20px' }, { padding: undefined })

// Passing controls: skipping a whole object and assigning an ordinary value.
export const skippedArguments = css({ padding: '20px' }, null, false, undefined)
export const ordinaryValue = css({ padding: '8px' }, { padding: '20px' })
