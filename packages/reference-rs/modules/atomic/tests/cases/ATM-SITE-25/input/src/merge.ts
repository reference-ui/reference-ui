import { css } from '@reference-ui/react'

declare const flag: boolean

export const merge = css([{ margin: '1r' }, { margin: '3r' }, false])
export const holes = css([{ color: 'red' }, null, { color: 'blue' }])
export const condElement = css([flag ? { color: 'green' } : { color: 'purple' }])
