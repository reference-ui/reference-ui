import { getPatternStyles, patternFns } from '../helpers.js';
import { css } from '../css/index.js';

const boxConfig = {
transform(props) {
  const blocklist = ["font", "weight", "container", "r"];
  const extensionKeys = new Set(blocklist);
  const rest = Object.fromEntries(
    Object.entries(props).filter(([k]) => !extensionKeys.has(k))
  );
  const _r0 = (function(props2) {
    const { font: font2, weight } = props2;
    const FONT_PRESETS = {
      sans: {
        fontFamily: "sans",
        fontWeight: "normal",
        letterSpacing: "-0.01em"
      },
      serif: {
        fontFamily: "serif",
        fontWeight: "normal",
        letterSpacing: "normal"
      },
      mono: {
        fontFamily: "mono",
        fontWeight: "normal",
        letterSpacing: "-0.04em"
      }
    };
    const WEIGHT_TOKENS = {
      "sans.thin": "200",
      "sans.light": "300",
      "sans.normal": "400",
      "sans.semibold": "600",
      "sans.bold": "700",
      "sans.black": "900",
      "serif.thin": "100",
      "serif.light": "300",
      "serif.normal": "373",
      "serif.semibold": "600",
      "serif.bold": "700",
      "serif.black": "900",
      "mono.thin": "100",
      "mono.light": "300",
      "mono.normal": "393",
      "mono.semibold": "600",
      "mono.bold": "700"
    };
    const result = {};
    if (font2 && FONT_PRESETS[font2]) {
      Object.assign(result, FONT_PRESETS[font2]);
    }
    if (weight && WEIGHT_TOKENS[weight]) {
      result.fontWeight = WEIGHT_TOKENS[weight];
    }
    return result;
  })(props);
  const _r1 = (function(props2) {
    const { container } = props2;
    if (container === void 0) return {};
    return {
      containerType: "inline-size",
      ...typeof container === "string" && container && { containerName: container }
    };
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