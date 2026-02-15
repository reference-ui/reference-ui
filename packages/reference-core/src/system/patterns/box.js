import { getPatternStyles, patternFns } from '../helpers.js';
import { css } from '../css/index.js';

const boxConfig = {
transform(props) {
  const { r, container, font, ...rest } = props;
  const FONT_PRESETS = {
    sans: { fontFamily: "sans", letterSpacing: "-0.01em", fontWeight: "400" },
    serif: { fontFamily: "serif", letterSpacing: "normal", fontWeight: "373" },
    mono: { fontFamily: "mono", letterSpacing: "-0.04em", fontWeight: "393" }
  };
  const fontStyles = font ? FONT_PRESETS[font] || {} : {};
  if (r) {
    const prefix = container ? `@container ${container} (min-width:` : `@container (min-width:`;
    return {
      ...fontStyles,
      ...rest,
      ...Object.fromEntries(
        Object.entries(r).map(([bp, styles]) => [`${prefix} ${bp}px)`, styles])
      )
    };
  }
  if (container !== void 0) {
    return {
      ...fontStyles,
      ...rest,
      containerType: "inline-size",
      ...typeof container === "string" && container && { containerName: container }
    };
  }
  return {
    ...fontStyles,
    ...rest
  };
}}

export const getBoxStyle = (styles = {}) => {
  const _styles = getPatternStyles(boxConfig, styles)
  return boxConfig.transform(_styles, patternFns)
}

export const box = (styles) => css(getBoxStyle(styles))
box.raw = getBoxStyle