import { getPatternStyles, patternFns } from '../helpers.js';
import { css } from '../css/index.js';

const boxConfig = {
transform:function transform(props) {
  const blocklist = ["r","container","size","font","weight"]
  const extensionKeys = new Set(blocklist)
  const rest = Object.fromEntries(
    Object.entries(props).filter(([key]) => !extensionKeys.has(key))
  )

  const _r0 = (function(props) {
      var BREAKPOINT_TABLE = {};
          var r = props.r;
          var container = props.container;
          if (!r) return {};
          var containerName = (typeof container === 'string' && container.length > 0) ? container : undefined;
          var prefix = containerName
            ? '@container ' + containerName + ' (min-width:'
            : '@container (min-width:';
          var entries = Object.entries(r);
          var out = {};
          for (var i = 0; i < entries.length; i++) {
            var bp = entries[i][0];
            var styles = entries[i][1];
            var width;
            var num = Number(bp);
            if (Number.isFinite(num) && bp !== '' && bp !== null) {
              width = String(num);
            } else if (Object.prototype.hasOwnProperty.call(BREAKPOINT_TABLE, bp)) {
              width = BREAKPOINT_TABLE[bp];
            } else {
              throw new Error(
                '[reference-ui] Unknown breakpoint name in r prop: "' + bp + '". ' +
                'Add it via tokens({ breakpoints: { ' + bp + ': { value: "<width>px" } } }).'
              );
            }
            out[prefix + ' ' + width + 'px)'] = styles;
          }
          return out;
  })(props)
  const _r1 = (function(props) {
      const { container } = props;
            if (container === void 0) return {};
            return {
              containerType: "inline-size",
              ...typeof container === "string" && container && { containerName: container }
            };
  })(props)
  const _r2 = (function(props) {
      const { size } = props;
            if (size === void 0 || typeof size !== "string" && typeof size !== "number") {
              return {};
            }
            return {
              width: size,
              height: size
            };
  })(props)
  const _r3 = (function(props) {
      const { font, weight } = props
        const FONT_PRESETS = {"sans":{"fontFamily":"sans","fontWeight":"normal","letterSpacing":"-0.01em"},"serif":{"fontFamily":"serif","fontWeight":"normal","letterSpacing":"normal"},"mono":{"fontFamily":"mono","fontWeight":"normal","letterSpacing":"-0.04em"}}
        const WEIGHT_TOKENS = {"sans.thin":"200","sans.light":"300","sans.normal":"400","sans.semibold":"600","sans.bold":"700","sans.black":"900","serif.thin":"100","serif.light":"300","serif.normal":"373","serif.semibold":"600","serif.bold":"700","serif.black":"900","mono.thin":"100","mono.light":"300","mono.normal":"393","mono.semibold":"600","mono.bold":"700"}
        const result = {}
        let resolvedWeight = undefined
      
        if (font && typeof font === 'string' && FONT_PRESETS[font]) {
          Object.assign(result, FONT_PRESETS[font])
        }
      
        if (weight && typeof weight === 'string') {
          if (WEIGHT_TOKENS[weight]) {
            resolvedWeight = WEIGHT_TOKENS[weight]
          } else if (font && typeof font === 'string') {
            const scopedWeight = `${font}.${weight}`
            if (WEIGHT_TOKENS[scopedWeight]) {
              resolvedWeight = WEIGHT_TOKENS[scopedWeight]
            }
          }
        }
      
        if (resolvedWeight) {
          result.fontWeight = resolvedWeight
        }
      
        return result
  })(props)

  return Object.assign({}, _r0, _r1, _r2, _r3, rest)
}}

export const getBoxStyle = (styles = {}) => {
  const _styles = getPatternStyles(boxConfig, styles)
  return boxConfig.transform(_styles, patternFns)
}

export const box = (styles) => css(getBoxStyle(styles))
box.raw = getBoxStyle