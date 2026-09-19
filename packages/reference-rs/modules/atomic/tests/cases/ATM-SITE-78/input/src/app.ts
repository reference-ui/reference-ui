import { css } from '@reference-ui/react'
import { button } from './tokens'
import { badge, button as barreled } from './barrel'
import { aye } from './cycle-a'
import { zest } from './cycle-a'

export const direct = css(button)
export const viaBarrel = css(barreled)
export const starLeaf = css(badge)
export const cycled = css(aye)
export const inner = css({ color: zest })
