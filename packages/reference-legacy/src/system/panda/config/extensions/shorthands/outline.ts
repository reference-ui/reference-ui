import {
  createShorthandUtility,
  type ShorthandConfig,
} from './factory'

export interface OutlineShorthandConfig extends Partial<ShorthandConfig> {}

export function createOutlineShorthandUtility(cfg: OutlineShorthandConfig = {}) {
  return createShorthandUtility({
    shorthand: cfg.shorthand ?? 'ring',
    className: cfg.className ?? 'ring',
    values: cfg.values ?? 'borders',
    group: cfg.group ?? 'Border',
    mainProp: cfg.mainProp ?? 'outline',
    widthProp: cfg.widthProp ?? 'outlineWidth',
    styleProp: cfg.styleProp ?? 'outlineStyle',
    colorProp: cfg.colorProp ?? 'outlineColor',
    isOutline: true,
    noneValue: cfg.noneValue ?? {
      outline: '2px solid transparent',
      outlineOffset: '2px',
    },
  })
}

export const outlineShorthandUtilities = {
  outline: createOutlineShorthandUtility(),
}
