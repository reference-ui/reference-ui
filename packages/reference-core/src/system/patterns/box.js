import { getPatternStyles, patternFns } from '../helpers.js';
import { css } from '../css/index.js';

const boxConfig = {
transform(props) {
  const { r, container, ...rest } = props;
  if (r) {
    const prefix = container ? `@container ${container} (min-width:` : `@container (min-width:`;
    for (const [bp, styles] of Object.entries(r)) {
      rest[`${prefix} ${bp}px)`] = styles;
    }
    return rest;
  }
  if (container !== void 0) {
    rest.containerType = "inline-size";
    if (typeof container === "string" && container) {
      rest.containerName = container;
    }
    return rest;
  }
  return rest;
}}

export const getBoxStyle = (styles = {}) => {
  const _styles = getPatternStyles(boxConfig, styles)
  return boxConfig.transform(_styles, patternFns)
}

export const box = (styles) => css(getBoxStyle(styles))
box.raw = getBoxStyle