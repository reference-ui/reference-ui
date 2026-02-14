import { getPatternStyles, patternFns } from '../helpers.js';
import { css } from '../css/index.js';

const boxConfig = {
transform(props) {
  const { r, container, font, ...rest } = props;
  if (r) {
    const prefix = container ? `@container ${container} (min-width:` : `@container (min-width:`;
    return {
      ...rest,
      ...Object.fromEntries(
        Object.entries(r).map(([bp, styles]) => [`${prefix} ${bp}px)`, styles])
      )
    };
  }
  if (container !== void 0) {
    return {
      ...rest,
      containerType: "inline-size",
      ...typeof container === "string" && container && { containerName: container }
    };
  }
  return rest;
}}

export const getBoxStyle = (styles = {}) => {
  const _styles = getPatternStyles(boxConfig, styles)
  return boxConfig.transform(_styles, patternFns)
}

export const box = (styles) => css(getBoxStyle(styles))
box.raw = getBoxStyle