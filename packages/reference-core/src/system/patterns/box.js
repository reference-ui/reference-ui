import { getPatternStyles, patternFns } from '../helpers.js';
import { css } from '../css/index.js';

const boxConfig = {
transform(props) {
  const blocklist = ["container", "font", "r"];
  const extensionKeys = new Set(blocklist);
  const rest = Object.fromEntries(
    Object.entries(props).filter(([k]) => !extensionKeys.has(k))
  );
  const _r0 = (function(props2) {
    const { container } = props2;
    if (container === void 0) return {};
    return {
      containerType: "inline-size",
      ...typeof container === "string" && container && { containerName: container }
    };
  })(props);
  const _r1 = (function(props2) {
    const { font } = props2;
    if (!font) return {};
    const FONT_PRESETS = {
      sans: { fontFamily: "sans", letterSpacing: "-0.01em", fontWeight: "400" },
      serif: { fontFamily: "serif", letterSpacing: "normal", fontWeight: "373" },
      mono: { fontFamily: "mono", letterSpacing: "-0.04em", fontWeight: "393" }
    };
    return FONT_PRESETS[font] || {};
  })(props);
  const _r2 = (function(props2) {
    const { r, container } = props2;
    if (!r) return {};
    const prefix = container ? `@container ${container} (min-width:` : `@container (min-width:`;
    return Object.fromEntries(
      Object.entries(r).map(([bp, styles]) => [`${prefix} ${bp}px)`, styles])
    );
  })(props);
  return Object.assign({}, _r0, _r1, _r2, rest);
}}

export const getBoxStyle = (styles = {}) => {
  const _styles = getPatternStyles(boxConfig, styles)
  return boxConfig.transform(_styles, patternFns)
}

export const box = (styles) => css(getBoxStyle(styles))
box.raw = getBoxStyle