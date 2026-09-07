import {
  createShorthandUtility,
  type ShorthandConfig,
} from './factory'

export type BorderShorthandConfig = ShorthandConfig

export function createBorderShorthandUtility(cfg: BorderShorthandConfig) {
  return createShorthandUtility(cfg)
}

export const borderShorthandUtilities = {
  border: createShorthandUtility({
    shorthand: 'b',
    className: 'bd',
    mainProp: 'border',
    widthProp: 'borderWidth',
    styleProp: 'borderStyle',
    colorProp: 'borderColor',
  }),
  borderTop: createShorthandUtility({
    shorthand: 'borderT',
    className: 'bd-t',
    mainProp: 'borderTop',
    widthProp: 'borderTopWidth',
    styleProp: 'borderTopStyle',
    colorProp: 'borderTopColor',
  }),
  borderRight: createShorthandUtility({
    shorthand: 'borderR',
    className: 'bd-r',
    mainProp: 'borderRight',
    widthProp: 'borderRightWidth',
    styleProp: 'borderRightStyle',
    colorProp: 'borderRightColor',
  }),
  borderBottom: createShorthandUtility({
    shorthand: 'borderB',
    className: 'bd-b',
    mainProp: 'borderBottom',
    widthProp: 'borderBottomWidth',
    styleProp: 'borderBottomStyle',
    colorProp: 'borderBottomColor',
  }),
  borderLeft: createShorthandUtility({
    shorthand: 'borderL',
    className: 'bd-l',
    mainProp: 'borderLeft',
    widthProp: 'borderLeftWidth',
    styleProp: 'borderLeftStyle',
    colorProp: 'borderLeftColor',
  }),
  borderInline: createShorthandUtility({
    shorthand: ['borderX', 'borderInline'],
    className: 'bd-x',
    mainProp: 'borderInline',
    widthProp: 'borderInlineWidth',
    styleProp: 'borderInlineStyle',
    colorProp: 'borderInlineColor',
  }),
  borderBlock: createShorthandUtility({
    shorthand: ['borderY', 'borderBlock'],
    className: 'bd-y',
    mainProp: 'borderBlock',
    widthProp: 'borderBlockWidth',
    styleProp: 'borderBlockStyle',
    colorProp: 'borderBlockColor',
  }),
  borderInlineStart: createShorthandUtility({
    shorthand: 'borderStart',
    className: 'bd-s',
    mainProp: 'borderInlineStart',
    widthProp: 'borderInlineStartWidth',
    styleProp: 'borderInlineStartStyle',
    colorProp: 'borderInlineStartColor',
  }),
  borderInlineEnd: createShorthandUtility({
    shorthand: 'borderEnd',
    className: 'bd-e',
    mainProp: 'borderInlineEnd',
    widthProp: 'borderInlineEndWidth',
    styleProp: 'borderInlineEndStyle',
    colorProp: 'borderInlineEndColor',
  }),
  borderBlockStart: createShorthandUtility({
    className: 'bd-bs',
    mainProp: 'borderBlockStart',
    widthProp: 'borderBlockStartWidth',
    styleProp: 'borderBlockStartStyle',
    colorProp: 'borderBlockStartColor',
  }),
  borderBlockEnd: createShorthandUtility({
    className: 'bd-be',
    mainProp: 'borderBlockEnd',
    widthProp: 'borderBlockEndWidth',
    styleProp: 'borderBlockEndStyle',
    colorProp: 'borderBlockEndColor',
  }),
}
