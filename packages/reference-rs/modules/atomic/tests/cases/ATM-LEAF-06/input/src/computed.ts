import { css } from '@reference-ui/react'

declare const dynamicKey: string
export const styles = css({ [dynamicKey]: '10px', color: 'red' })
