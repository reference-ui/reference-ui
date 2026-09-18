var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/parse.js
var require_parse = __commonJS({
  "../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/parse.js"(exports, module) {
    var openParentheses = "(".charCodeAt(0);
    var closeParentheses = ")".charCodeAt(0);
    var singleQuote = "'".charCodeAt(0);
    var doubleQuote = '"'.charCodeAt(0);
    var backslash = "\\".charCodeAt(0);
    var slash = "/".charCodeAt(0);
    var comma = ",".charCodeAt(0);
    var colon = ":".charCodeAt(0);
    var star = "*".charCodeAt(0);
    var uLower = "u".charCodeAt(0);
    var uUpper = "U".charCodeAt(0);
    var plus = "+".charCodeAt(0);
    var isUnicodeRange = /^[a-f0-9?-]+$/i;
    module.exports = function(input) {
      var tokens = [];
      var value = input;
      var next, quote, prev, token, escape, escapePos, whitespacePos, parenthesesOpenPos;
      var pos = 0;
      var code = value.charCodeAt(pos);
      var max = value.length;
      var stack = [{ nodes: tokens }];
      var balanced = 0;
      var parent;
      var name = "";
      var before = "";
      var after = "";
      while (pos < max) {
        if (code <= 32) {
          next = pos;
          do {
            next += 1;
            code = value.charCodeAt(next);
          } while (code <= 32);
          token = value.slice(pos, next);
          prev = tokens[tokens.length - 1];
          if (code === closeParentheses && balanced) {
            after = token;
          } else if (prev && prev.type === "div") {
            prev.after = token;
            prev.sourceEndIndex += token.length;
          } else if (code === comma || code === colon || code === slash && value.charCodeAt(next + 1) !== star && (!parent || parent && parent.type === "function" && parent.value !== "calc")) {
            before = token;
          } else {
            tokens.push({
              type: "space",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          }
          pos = next;
        } else if (code === singleQuote || code === doubleQuote) {
          next = pos;
          quote = code === singleQuote ? "'" : '"';
          token = {
            type: "string",
            sourceIndex: pos,
            quote
          };
          do {
            escape = false;
            next = value.indexOf(quote, next + 1);
            if (~next) {
              escapePos = next;
              while (value.charCodeAt(escapePos - 1) === backslash) {
                escapePos -= 1;
                escape = !escape;
              }
            } else {
              value += quote;
              next = value.length - 1;
              token.unclosed = true;
            }
          } while (escape);
          token.value = value.slice(pos + 1, next);
          token.sourceEndIndex = token.unclosed ? next : next + 1;
          tokens.push(token);
          pos = next + 1;
          code = value.charCodeAt(pos);
        } else if (code === slash && value.charCodeAt(pos + 1) === star) {
          next = value.indexOf("*/", pos);
          token = {
            type: "comment",
            sourceIndex: pos,
            sourceEndIndex: next + 2
          };
          if (next === -1) {
            token.unclosed = true;
            next = value.length;
            token.sourceEndIndex = next;
          }
          token.value = value.slice(pos + 2, next);
          tokens.push(token);
          pos = next + 2;
          code = value.charCodeAt(pos);
        } else if ((code === slash || code === star) && parent && parent.type === "function" && parent.value === "calc") {
          token = value[pos];
          tokens.push({
            type: "word",
            sourceIndex: pos - before.length,
            sourceEndIndex: pos + token.length,
            value: token
          });
          pos += 1;
          code = value.charCodeAt(pos);
        } else if (code === slash || code === comma || code === colon) {
          token = value[pos];
          tokens.push({
            type: "div",
            sourceIndex: pos - before.length,
            sourceEndIndex: pos + token.length,
            value: token,
            before,
            after: ""
          });
          before = "";
          pos += 1;
          code = value.charCodeAt(pos);
        } else if (openParentheses === code) {
          next = pos;
          do {
            next += 1;
            code = value.charCodeAt(next);
          } while (code <= 32);
          parenthesesOpenPos = pos;
          token = {
            type: "function",
            sourceIndex: pos - name.length,
            value: name,
            before: value.slice(parenthesesOpenPos + 1, next)
          };
          pos = next;
          if (name === "url" && code !== singleQuote && code !== doubleQuote) {
            next -= 1;
            do {
              escape = false;
              next = value.indexOf(")", next + 1);
              if (~next) {
                escapePos = next;
                while (value.charCodeAt(escapePos - 1) === backslash) {
                  escapePos -= 1;
                  escape = !escape;
                }
              } else {
                value += ")";
                next = value.length - 1;
                token.unclosed = true;
              }
            } while (escape);
            whitespacePos = next;
            do {
              whitespacePos -= 1;
              code = value.charCodeAt(whitespacePos);
            } while (code <= 32);
            if (parenthesesOpenPos < whitespacePos) {
              if (pos !== whitespacePos + 1) {
                token.nodes = [
                  {
                    type: "word",
                    sourceIndex: pos,
                    sourceEndIndex: whitespacePos + 1,
                    value: value.slice(pos, whitespacePos + 1)
                  }
                ];
              } else {
                token.nodes = [];
              }
              if (token.unclosed && whitespacePos + 1 !== next) {
                token.after = "";
                token.nodes.push({
                  type: "space",
                  sourceIndex: whitespacePos + 1,
                  sourceEndIndex: next,
                  value: value.slice(whitespacePos + 1, next)
                });
              } else {
                token.after = value.slice(whitespacePos + 1, next);
                token.sourceEndIndex = next;
              }
            } else {
              token.after = "";
              token.nodes = [];
            }
            pos = next + 1;
            token.sourceEndIndex = token.unclosed ? next : pos;
            code = value.charCodeAt(pos);
            tokens.push(token);
          } else {
            balanced += 1;
            token.after = "";
            token.sourceEndIndex = pos + 1;
            tokens.push(token);
            stack.push(token);
            tokens = token.nodes = [];
            parent = token;
          }
          name = "";
        } else if (closeParentheses === code && balanced) {
          pos += 1;
          code = value.charCodeAt(pos);
          parent.after = after;
          parent.sourceEndIndex += after.length;
          after = "";
          balanced -= 1;
          stack[stack.length - 1].sourceEndIndex = pos;
          stack.pop();
          parent = stack[balanced];
          tokens = parent.nodes;
        } else {
          next = pos;
          do {
            if (code === backslash) {
              next += 1;
            }
            next += 1;
            code = value.charCodeAt(next);
          } while (next < max && !(code <= 32 || code === singleQuote || code === doubleQuote || code === comma || code === colon || code === slash || code === openParentheses || code === star && parent && parent.type === "function" && parent.value === "calc" || code === slash && parent.type === "function" && parent.value === "calc" || code === closeParentheses && balanced));
          token = value.slice(pos, next);
          if (openParentheses === code) {
            name = token;
          } else if ((uLower === token.charCodeAt(0) || uUpper === token.charCodeAt(0)) && plus === token.charCodeAt(1) && isUnicodeRange.test(token.slice(2))) {
            tokens.push({
              type: "unicode-range",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          } else {
            tokens.push({
              type: "word",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          }
          pos = next;
        }
      }
      for (pos = stack.length - 1; pos; pos -= 1) {
        stack[pos].unclosed = true;
        stack[pos].sourceEndIndex = value.length;
      }
      return stack[0].nodes;
    };
  }
});

// ../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/walk.js
var require_walk = __commonJS({
  "../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/walk.js"(exports, module) {
    module.exports = /* @__PURE__ */ __name(function walk(nodes, cb, bubble) {
      var i, max, node, result;
      for (i = 0, max = nodes.length; i < max; i += 1) {
        node = nodes[i];
        if (!bubble) {
          result = cb(node, i, nodes);
        }
        if (result !== false && node.type === "function" && Array.isArray(node.nodes)) {
          walk(node.nodes, cb, bubble);
        }
        if (bubble) {
          cb(node, i, nodes);
        }
      }
    }, "walk");
  }
});

// ../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/stringify.js
var require_stringify = __commonJS({
  "../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/stringify.js"(exports, module) {
    function stringifyNode(node, custom) {
      var type = node.type;
      var value = node.value;
      var buf;
      var customResult;
      if (custom && (customResult = custom(node)) !== void 0) {
        return customResult;
      } else if (type === "word" || type === "space") {
        return value;
      } else if (type === "string") {
        buf = node.quote || "";
        return buf + value + (node.unclosed ? "" : buf);
      } else if (type === "comment") {
        return "/*" + value + (node.unclosed ? "" : "*/");
      } else if (type === "div") {
        return (node.before || "") + value + (node.after || "");
      } else if (Array.isArray(node.nodes)) {
        buf = stringify(node.nodes, custom);
        if (type !== "function") {
          return buf;
        }
        return value + "(" + (node.before || "") + buf + (node.after || "") + (node.unclosed ? "" : ")");
      }
      return value;
    }
    __name(stringifyNode, "stringifyNode");
    function stringify(nodes, custom) {
      var result, i;
      if (Array.isArray(nodes)) {
        result = "";
        for (i = nodes.length - 1; ~i; i -= 1) {
          result = stringifyNode(nodes[i], custom) + result;
        }
        return result;
      }
      return stringifyNode(nodes, custom);
    }
    __name(stringify, "stringify");
    module.exports = stringify;
  }
});

// ../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/unit.js
var require_unit = __commonJS({
  "../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/unit.js"(exports, module) {
    var minus = "-".charCodeAt(0);
    var plus = "+".charCodeAt(0);
    var dot = ".".charCodeAt(0);
    var exp = "e".charCodeAt(0);
    var EXP = "E".charCodeAt(0);
    function likeNumber(value) {
      var code = value.charCodeAt(0);
      var nextCode;
      if (code === plus || code === minus) {
        nextCode = value.charCodeAt(1);
        if (nextCode >= 48 && nextCode <= 57) {
          return true;
        }
        var nextNextCode = value.charCodeAt(2);
        if (nextCode === dot && nextNextCode >= 48 && nextNextCode <= 57) {
          return true;
        }
        return false;
      }
      if (code === dot) {
        nextCode = value.charCodeAt(1);
        if (nextCode >= 48 && nextCode <= 57) {
          return true;
        }
        return false;
      }
      if (code >= 48 && code <= 57) {
        return true;
      }
      return false;
    }
    __name(likeNumber, "likeNumber");
    module.exports = function(value) {
      var pos = 0;
      var length = value.length;
      var code;
      var nextCode;
      var nextNextCode;
      if (length === 0 || !likeNumber(value)) {
        return false;
      }
      code = value.charCodeAt(pos);
      if (code === plus || code === minus) {
        pos++;
      }
      while (pos < length) {
        code = value.charCodeAt(pos);
        if (code < 48 || code > 57) {
          break;
        }
        pos += 1;
      }
      code = value.charCodeAt(pos);
      nextCode = value.charCodeAt(pos + 1);
      if (code === dot && nextCode >= 48 && nextCode <= 57) {
        pos += 2;
        while (pos < length) {
          code = value.charCodeAt(pos);
          if (code < 48 || code > 57) {
            break;
          }
          pos += 1;
        }
      }
      code = value.charCodeAt(pos);
      nextCode = value.charCodeAt(pos + 1);
      nextNextCode = value.charCodeAt(pos + 2);
      if ((code === exp || code === EXP) && (nextCode >= 48 && nextCode <= 57 || (nextCode === plus || nextCode === minus) && nextNextCode >= 48 && nextNextCode <= 57)) {
        pos += nextCode === plus || nextCode === minus ? 3 : 2;
        while (pos < length) {
          code = value.charCodeAt(pos);
          if (code < 48 || code > 57) {
            break;
          }
          pos += 1;
        }
      }
      return {
        number: value.slice(0, pos),
        unit: value.slice(pos)
      };
    };
  }
});

// ../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/.pnpm/postcss-value-parser@4.2.0/node_modules/postcss-value-parser/lib/index.js"(exports, module) {
    var parse = require_parse();
    var walk = require_walk();
    var stringify = require_stringify();
    function ValueParser(value) {
      if (this instanceof ValueParser) {
        this.nodes = parse(value);
        return this;
      }
      return new ValueParser(value);
    }
    __name(ValueParser, "ValueParser");
    ValueParser.prototype.toString = function() {
      return Array.isArray(this.nodes) ? stringify(this.nodes) : "";
    };
    ValueParser.prototype.walk = function(cb, bubble) {
      walk(this.nodes, cb, bubble);
      return this;
    };
    ValueParser.unit = require_unit();
    ValueParser.walk = walk;
    ValueParser.stringify = stringify;
    module.exports = ValueParser;
  }
});

// ../reference-core/src/system/panda/config/extensions/api/runtime.ts
var PANDA_CONFIG_GLOBAL_KEY = "__refPandaConfigCollector";
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject, "isPlainObject");
function toRecord(value) {
  return isPlainObject(value) ? value : {};
}
__name(toRecord, "toRecord");
function deepMerge(target, ...sources) {
  const result = { ...target };
  for (const source of sources) {
    if (!isPlainObject(source)) continue;
    for (const key of Object.keys(source)) {
      const sourceVal = source[key];
      const targetVal = result[key];
      if (Array.isArray(sourceVal) || typeof sourceVal === "function") {
        result[key] = sourceVal;
        continue;
      }
      if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
        result[key] = deepMerge({ ...targetVal }, sourceVal);
        continue;
      }
      if (isPlainObject(sourceVal)) {
        result[key] = deepMerge({}, sourceVal);
        continue;
      }
      result[key] = sourceVal;
    }
  }
  return result;
}
__name(deepMerge, "deepMerge");
function getPandaConfig() {
  const runtime = globalThis;
  const existing = runtime[PANDA_CONFIG_GLOBAL_KEY];
  if (isPlainObject(existing)) {
    return existing;
  }
  const nextConfig = {};
  runtime[PANDA_CONFIG_GLOBAL_KEY] = nextConfig;
  return nextConfig;
}
__name(getPandaConfig, "getPandaConfig");
function initPandaConfig(baseConfig) {
  const runtime = globalThis;
  const nextConfig = deepMerge({}, toRecord(baseConfig));
  runtime[PANDA_CONFIG_GLOBAL_KEY] = nextConfig;
  return nextConfig;
}
__name(initPandaConfig, "initPandaConfig");

// ../reference-core/src/system/panda/config/extensions/api/font.ts
var import_postcss_value_parser = __toESM(require_lib(), 1);
function getFontFaceRules(fontFace) {
  return Array.isArray(fontFace) ? fontFace : [fontFace];
}
__name(getFontFaceRules, "getFontFaceRules");
function getDefaultFontWeight(font) {
  return font.css?.fontWeight ?? font.weights.normal ?? "400";
}
__name(getDefaultFontWeight, "getDefaultFontWeight");
function getFontPreset(font) {
  return {
    fontFamily: font.name,
    fontWeight: getDefaultFontWeight(font),
    ...font.css
  };
}
__name(getFontPreset, "getFontPreset");
function parseFontFamilyName(value) {
  if (!value || typeof value !== "string") {
    return "unknown";
  }
  const parsed = (0, import_postcss_value_parser.default)(value.trim());
  const firstFamilyNodes = [];
  for (const node of parsed.nodes) {
    if (node.type === "div" && node.value === ",") {
      break;
    }
    firstFamilyNodes.push(node);
  }
  while (firstFamilyNodes.length > 0 && firstFamilyNodes[0].type === "space") {
    firstFamilyNodes.shift();
  }
  while (firstFamilyNodes.length > 0 && firstFamilyNodes[firstFamilyNodes.length - 1].type === "space") {
    firstFamilyNodes.pop();
  }
  if (firstFamilyNodes.length === 0) {
    return "unknown";
  }
  if (firstFamilyNodes.length === 1 && firstFamilyNodes[0].type === "string") {
    return firstFamilyNodes[0].value;
  }
  return import_postcss_value_parser.default.stringify(firstFamilyNodes).trim() || "unknown";
}
__name(parseFontFamilyName, "parseFontFamilyName");
function createFontPatternTransform(presets, weightTokens) {
  const transformSource = [
    "return function transform(props) {",
    "  const { font, weight } = props",
    `  const FONT_PRESETS = ${JSON.stringify(presets)}`,
    `  const WEIGHT_TOKENS = ${JSON.stringify(weightTokens)}`,
    "  const result = {}",
    "  let resolvedWeight = undefined",
    "",
    "  if (font && typeof font === 'string' && FONT_PRESETS[font]) {",
    "    Object.assign(result, FONT_PRESETS[font])",
    "  }",
    "",
    "  if (weight && typeof weight === 'string') {",
    "    if (WEIGHT_TOKENS[weight]) {",
    "      resolvedWeight = WEIGHT_TOKENS[weight]",
    "    } else if (font && typeof font === 'string') {",
    "      const scopedWeight = `${font}.${weight}`",
    "      if (WEIGHT_TOKENS[scopedWeight]) {",
    "        resolvedWeight = WEIGHT_TOKENS[scopedWeight]",
    "      }",
    "    }",
    "  }",
    "",
    "  if (resolvedWeight) {",
    "    result.fontWeight = resolvedWeight",
    "  }",
    "",
    "  return result",
    "}"
  ].join("\n");
  return new Function(transformSource)();
}
__name(createFontPatternTransform, "createFontPatternTransform");
function buildFontTokens(fonts) {
  if (fonts.length === 0) {
    return {};
  }
  const fontWeights = {};
  for (const font of fonts) {
    const scopedWeights = fontWeights[font.name] ?? {};
    for (const [weightName, weightValue] of Object.entries(font.weights)) {
      scopedWeights[weightName] = { value: weightValue };
    }
    fontWeights[font.name] = scopedWeights;
  }
  return {
    fonts: Object.fromEntries(fonts.map((font) => [font.name, { value: font.value }])),
    fontWeights
  };
}
__name(buildFontTokens, "buildFontTokens");
function buildFontFaces(fonts) {
  return Object.fromEntries(
    fonts.flatMap((font) => {
      const fontFaceRules = getFontFaceRules(font.fontFace).filter((fontFace) => Boolean(fontFace.src)).map((fontFace) => ({
        src: fontFace.src,
        fontDisplay: fontFace.fontDisplay ?? "swap",
        ...fontFace.fontWeight ? { fontWeight: fontFace.fontWeight } : {},
        ...fontFace.fontStyle ? { fontStyle: fontFace.fontStyle } : {},
        ...fontFace.sizeAdjust ? { sizeAdjust: fontFace.sizeAdjust } : {},
        ...fontFace.descentOverride ? { descentOverride: fontFace.descentOverride } : {}
      }));
      if (fontFaceRules.length === 0) {
        return [];
      }
      return [[parseFontFamilyName(font.value), fontFaceRules.length === 1 ? fontFaceRules[0] : fontFaceRules]];
    })
  );
}
__name(buildFontFaces, "buildFontFaces");
function buildFontRecipes(fonts) {
  if (fonts.length === 0) {
    return {};
  }
  return {
    fontStyle: {
      className: "r_font",
      variants: {
        font: Object.fromEntries(fonts.map((font) => [font.name, getFontPreset(font)]))
      }
    }
  };
}
__name(buildFontRecipes, "buildFontRecipes");
function buildFontPatternExtensions(fonts) {
  if (fonts.length === 0) {
    return [];
  }
  const presets = Object.fromEntries(fonts.map((font) => [font.name, getFontPreset(font)]));
  const weightTokens = Object.fromEntries(
    fonts.flatMap(
      (font) => Object.entries(font.weights).map(([weightName, weightValue]) => [
        `${font.name}.${weightName}`,
        weightValue
      ])
    )
  );
  return [
    {
      properties: {
        font: { type: "string" },
        weight: { type: "string" }
      },
      transform: createFontPatternTransform(presets, weightTokens)
    }
  ];
}
__name(buildFontPatternExtensions, "buildFontPatternExtensions");

// ../reference-core/src/system/panda/config/extensions/api/extendFontFaces.ts
function extendFontFaces(fontface) {
  if (Object.keys(fontface).length === 0) {
    return getPandaConfig();
  }
  const pandaConfig = getPandaConfig();
  pandaConfig.globalFontface = deepMerge({}, toRecord(pandaConfig.globalFontface), fontface);
  return pandaConfig;
}
__name(extendFontFaces, "extendFontFaces");

// ../reference-core/src/system/panda/config/extensions/api/extendThemes.ts
function getStaticThemeNames(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry) => typeof entry === "string");
}
__name(getStaticThemeNames, "getStaticThemeNames");
function extendThemes(first, ...rest) {
  const themeFragments = Array.isArray(first) && rest.length === 0 ? first : [first, ...rest];
  if (themeFragments.length === 0) {
    return getPandaConfig();
  }
  const pandaConfig = getPandaConfig();
  const mergedThemes = deepMerge({}, ...themeFragments);
  const themeNames = Object.keys(mergedThemes);
  if (themeNames.length === 0) {
    return pandaConfig;
  }
  pandaConfig.themes = deepMerge({}, toRecord(pandaConfig.themes), mergedThemes);
  const staticCss = toRecord(pandaConfig.staticCss);
  const existingThemes = getStaticThemeNames(staticCss.themes);
  pandaConfig.staticCss = {
    ...staticCss,
    themes: Array.from(/* @__PURE__ */ new Set([...existingThemes, ...themeNames]))
  };
  return pandaConfig;
}
__name(extendThemes, "extendThemes");

// ../reference-core/src/system/panda/config/extensions/api/extendTokens.ts
function extendTokens(first, ...rest) {
  const tokenFragments = Array.isArray(first) && rest.length === 0 ? first : [first, ...rest];
  if (tokenFragments.length === 0) {
    return getPandaConfig();
  }
  const pandaConfig = getPandaConfig();
  const mergedTokens = deepMerge({}, ...tokenFragments);
  pandaConfig.theme = deepMerge({}, toRecord(pandaConfig.theme), {
    tokens: mergedTokens
  });
  return pandaConfig;
}
__name(extendTokens, "extendTokens");

// ../reference-core/src/system/panda/config/extensions/api/extendKeyframes.ts
function extendKeyframes(keyframesFragments) {
  if (keyframesFragments.length === 0) {
    return getPandaConfig();
  }
  const pandaConfig = getPandaConfig();
  const mergedKeyframes = deepMerge({}, ...keyframesFragments);
  pandaConfig.theme = deepMerge({}, toRecord(pandaConfig.theme), {
    extend: {
      keyframes: mergedKeyframes
    }
  });
  return pandaConfig;
}
__name(extendKeyframes, "extendKeyframes");

// ../reference-core/src/lib/paths/ref-config.ts
import { existsSync } from "node:fs";
import { resolve } from "node:path";
var CONFIG_CANDIDATES = ["ui.config.ts", "ui.config.js", "ui.config.mjs"];
function resolveRefConfigFile(cwd) {
  for (const candidate of CONFIG_CANDIDATES) {
    const path = resolve(cwd, candidate);
    if (existsSync(path)) return path;
  }
  return null;
}
__name(resolveRefConfigFile, "resolveRefConfigFile");

// ../reference-core/src/constants.ts
var GENERATED_PACKAGE_NAMES = [
  "react",
  "system",
  "styled",
  "types"
];
var GENERATED_OUTPUT_ROOTS = [
  ...GENERATED_PACKAGE_NAMES,
  "mcp",
  "virtual"
];
var DEFAULT_OUT_DIR = ".reference-ui";
var SYNC_OUTPUT_DIR_GLOB = `**/${DEFAULT_OUT_DIR}/**`;

// ../reference-core/src/lib/paths/global-registry.ts
import { existsSync as existsSync2, mkdirSync, readFileSync, renameSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve as resolve2 } from "node:path";
import { homedir } from "node:os";
var GlobalProjectRegistry = class {
  static {
    __name(this, "GlobalProjectRegistry");
  }
  static {
    this.overridePath = null;
  }
  static setRegistryPathForTesting(customPath) {
    this.overridePath = customPath;
  }
  static getRegistryPath() {
    return this.overridePath ?? process.env.REF_REGISTRY_PATH ?? join(homedir(), ".reference-ui", "registry.json");
  }
  static read() {
    const registryPath = this.getRegistryPath();
    if (!existsSync2(registryPath)) {
      return { projects: {}, sanitizedCount: 0 };
    }
    try {
      const raw = JSON.parse(readFileSync(registryPath, "utf8"));
      const projects = raw.projects ?? {};
      const valid = {};
      let sanitizedCount = 0;
      for (const [projectPath, entry] of Object.entries(projects)) {
        if (entry && typeof entry.configPath === "string" && existsSync2(entry.configPath)) {
          valid[projectPath] = entry;
        } else {
          sanitizedCount++;
        }
      }
      if (sanitizedCount > 0) {
        this.write(valid);
      }
      return { projects: valid, sanitizedCount };
    } catch {
      try {
        const backupPath = `${registryPath}.bak`;
        renameSync(registryPath, backupPath);
      } catch {
      }
      return { projects: {}, sanitizedCount: 0 };
    }
  }
  static upsert(rawProjectPath) {
    const configPath = resolveRefConfigFile(rawProjectPath);
    if (!configPath) return;
    let projectPath = resolve2(rawProjectPath);
    try {
      projectPath = realpathSync(projectPath);
    } catch {
    }
    const { projects } = this.read();
    projects[projectPath] = {
      configPath,
      lastActive: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.write(projects);
  }
  static write(projects) {
    const registryPath = this.getRegistryPath();
    try {
      mkdirSync(dirname(registryPath), { recursive: true });
      const tmpPath = `${registryPath}.tmp.${process.pid}.${Date.now()}`;
      writeFileSync(tmpPath, JSON.stringify({ version: 1, projects }, null, 2), "utf8");
      renameSync(tmpPath, registryPath);
    } catch {
    }
  }
};

// ../reference-core/src/system/primitives/tags.ts
var TAGS = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "map",
  "mark",
  "menu",
  "meter",
  "nav",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "search",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "svg",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr"
];
function toJsxName(tag) {
  if (tag === "object") return "Obj";
  if (tag === "var") return "Var";
  if (tag.length <= 1) return tag.toUpperCase();
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}
__name(toJsxName, "toJsxName");
var PRIMITIVE_JSX_NAMES = TAGS.map(toJsxName);

// ../reference-core/src/system/panda/config/jsx-elements.ts
function normalizeAdditionalJsxElements(names) {
  const primitiveSet = new Set(PRIMITIVE_JSX_NAMES);
  return [...new Set(names.map((name) => name.trim()).filter((name) => name.length > 0))].filter((name) => !primitiveSet.has(name)).sort();
}
__name(normalizeAdditionalJsxElements, "normalizeAdditionalJsxElements");
function resolvePandaJsxElements(additionalJsxElements) {
  return [...PRIMITIVE_JSX_NAMES, ...normalizeAdditionalJsxElements(additionalJsxElements)];
}
__name(resolvePandaJsxElements, "resolvePandaJsxElements");

// ../reference-core/src/system/panda/config/extensions/api/extendPatterns.ts
function getTransformBody(transform) {
  const source = transform.toString();
  const bodyStart = source.indexOf("{");
  const bodyEnd = source.lastIndexOf("}");
  if (bodyStart < 0 || bodyEnd <= bodyStart) {
    return "";
  }
  return source.slice(bodyStart + 1, bodyEnd).trim();
}
__name(getTransformBody, "getTransformBody");
function createBoxTransform(extensions, additionalJsxElements) {
  const properties = Object.assign(
    {},
    ...extensions.map((extension) => extension.properties)
  );
  const blocklist = Object.keys(properties);
  const resultVars = extensions.map((_, index) => `_r${index}`);
  const transformBlocks = extensions.map((extension, index) => {
    const body = getTransformBody(extension.transform).split("\n").map((line) => `    ${line}`).join("\n");
    return [`const _r${index} = (function(props) {`, body, `})(props)`].join("\n");
  });
  const transformSource = [
    "return function transform(props) {",
    `  const blocklist = ${JSON.stringify(blocklist)}`,
    "  const extensionKeys = new Set(blocklist)",
    "  const rest = Object.fromEntries(",
    "    Object.entries(props).filter(([key]) => !extensionKeys.has(key))",
    "  )",
    "",
    ...transformBlocks.map(
      (block) => block.split("\n").map((line) => `  ${line}`).join("\n")
    ),
    "",
    `  return Object.assign({}, ${resultVars.join(", ")}, rest)`,
    "}"
  ].join("\n");
  const transform = new Function(transformSource)();
  return {
    jsx: resolvePandaJsxElements(additionalJsxElements),
    properties,
    blocklist,
    transform
  };
}
__name(createBoxTransform, "createBoxTransform");
function extendPatterns(extensions, additionalJsxElements = []) {
  if (extensions.length === 0) {
    return getPandaConfig();
  }
  const pandaConfig = getPandaConfig();
  const boxPattern = createBoxTransform(extensions, additionalJsxElements);
  pandaConfig.patterns = deepMerge({}, toRecord(pandaConfig.patterns), {
    extend: {
      box: boxPattern
    }
  });
  return pandaConfig;
}
__name(extendPatterns, "extendPatterns");

// ../reference-core/src/system/panda/config/extensions/api/extendRecipes.ts
function extendRecipes(recipes) {
  if (Object.keys(recipes).length === 0) {
    return getPandaConfig();
  }
  const pandaConfig = getPandaConfig();
  pandaConfig.theme = deepMerge({}, toRecord(pandaConfig.theme), {
    recipes
  });
  return pandaConfig;
}
__name(extendRecipes, "extendRecipes");

// ../reference-core/src/system/panda/config/extensions/api/extendUtilities.ts
function extendUtilities(utilitiesExtend) {
  const pandaConfig = getPandaConfig();
  pandaConfig.utilities = deepMerge({}, toRecord(pandaConfig.utilities), {
    extend: utilitiesExtend
  });
  return pandaConfig;
}
__name(extendUtilities, "extendUtilities");

// ../reference-core/src/system/panda/config/extensions/api/extendGlobalCss.ts
function extendGlobalCss(first, ...rest) {
  const cssFragments = Array.isArray(first) && rest.length === 0 ? first : [first, ...rest];
  if (cssFragments.length === 0) {
    return getPandaConfig();
  }
  const pandaConfig = getPandaConfig();
  pandaConfig.globalCss = deepMerge({}, toRecord(pandaConfig.globalCss), ...cssFragments);
  return pandaConfig;
}
__name(extendGlobalCss, "extendGlobalCss");

// ../reference-core/src/lib/fragments/types.ts
var CONFIG_FRAGMENT_SOURCE_PROPERTY = "__refConfigFragmentSource";

// ../reference-core/src/system/panda/config/extensions/api/resolveColorModeTokens.ts
var PRIVATE_TOKEN_KEY = "_private";
var UPSTREAM_FRAGMENT_SOURCE = "upstream system fragment";
function isPlainObject2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject2, "isPlainObject");
function isReferenceTokenLeaf(value) {
  if (!isPlainObject2(value) || !("value" in value || "light" in value || "dark" in value)) {
    return false;
  }
  const { light, dark } = value;
  if (light !== void 0 && isPlainObject2(light)) {
    return false;
  }
  if (dark !== void 0 && isPlainObject2(dark)) {
    return false;
  }
  return true;
}
__name(isReferenceTokenLeaf, "isReferenceTokenLeaf");
function stripModeOverrides(token) {
  return Object.fromEntries(
    Object.entries(token).filter(([key]) => key !== "light" && key !== "dark")
  );
}
__name(stripModeOverrides, "stripModeOverrides");
function hasKeys(value) {
  return Object.keys(value).length > 0;
}
__name(hasKeys, "hasKeys");
function createThemeLeaf(baseLeaf, modeValue) {
  return {
    ...baseLeaf,
    value: modeValue
  };
}
__name(createThemeLeaf, "createThemeLeaf");
function getBaseLeafValue(node) {
  const hasExplicitPair = node.light !== void 0 && node.dark !== void 0;
  if (hasExplicitPair) return node.light;
  return node.value ?? node.light ?? node.dark;
}
__name(getBaseLeafValue, "getBaseLeafValue");
function getLeafThemeValue(node, themeName) {
  if (themeName === "light") {
    if (node.light !== void 0) return node.light;
    if (node.value !== void 0 && node.dark !== void 0) return node.value;
    return void 0;
  }
  if (node.dark !== void 0) return node.dark;
  if (node.value !== void 0 && node.light !== void 0) return node.value;
  return void 0;
}
__name(getLeafThemeValue, "getLeafThemeValue");
function createLeafThemeNodes(node, tokenFields) {
  const themeNodes = {};
  const lightValue = getLeafThemeValue(node, "light");
  const darkValue = getLeafThemeValue(node, "dark");
  if (lightValue !== void 0) {
    themeNodes.light = createThemeLeaf(tokenFields, lightValue);
  }
  if (darkValue !== void 0) {
    themeNodes.dark = createThemeLeaf(tokenFields, darkValue);
  }
  return themeNodes;
}
__name(createLeafThemeNodes, "createLeafThemeNodes");
function normalizeLeafTokenNode(node) {
  const tokenFields = stripModeOverrides(node);
  const baseValue = getBaseLeafValue(node);
  const baseNode = baseValue !== void 0 ? { ...tokenFields, value: baseValue } : {};
  const themeNodes = createLeafThemeNodes(node, tokenFields);
  return {
    baseNode,
    themeNodes
  };
}
__name(normalizeLeafTokenNode, "normalizeLeafTokenNode");
function mergeChildIntoParentThemes(themeNodes, key, child) {
  if (child.themeNodes.light && hasKeys(child.themeNodes.light)) {
    const lightNode = themeNodes.light ?? {};
    lightNode[key] = child.themeNodes.light;
    themeNodes.light = lightNode;
  }
  if (child.themeNodes.dark && hasKeys(child.themeNodes.dark)) {
    const darkNode = themeNodes.dark ?? {};
    darkNode[key] = child.themeNodes.dark;
    themeNodes.dark = darkNode;
  }
}
__name(mergeChildIntoParentThemes, "mergeChildIntoParentThemes");
function normalizeObjectTokenNode(node) {
  const baseNode = {};
  const themeNodes = {};
  for (const [key, value] of Object.entries(node)) {
    if (!isPlainObject2(value)) {
      continue;
    }
    const normalizedChild = normalizeTokenNode(value);
    if (hasKeys(normalizedChild.baseNode)) {
      baseNode[key] = normalizedChild.baseNode;
    }
    mergeChildIntoParentThemes(themeNodes, key, normalizedChild);
  }
  return { baseNode, themeNodes };
}
__name(normalizeObjectTokenNode, "normalizeObjectTokenNode");
function normalizeTokenNode(node) {
  if (isReferenceTokenLeaf(node)) {
    return normalizeLeafTokenNode(node);
  }
  return normalizeObjectTokenNode(node);
}
__name(normalizeTokenNode, "normalizeTokenNode");
function isUpstreamFragment(fragment) {
  if (fragment === null || typeof fragment !== "object") return false;
  const source = fragment[CONFIG_FRAGMENT_SOURCE_PROPERTY];
  return source === UPSTREAM_FRAGMENT_SOURCE;
}
__name(isUpstreamFragment, "isUpstreamFragment");
function stripPrivateTokensDeep(node) {
  const result = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === PRIVATE_TOKEN_KEY) continue;
    if (isPlainObject2(value)) {
      result[key] = stripPrivateTokensDeep(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
__name(stripPrivateTokensDeep, "stripPrivateTokensDeep");
function applyPrivateScope(fragment) {
  if (!isUpstreamFragment(fragment)) return fragment;
  return stripPrivateTokensDeep(fragment);
}
__name(applyPrivateScope, "applyPrivateScope");
function resolveColorModeTokens(fragments) {
  const resolved = {
    baseTokens: {},
    themes: {}
  };
  for (const rawFragment of fragments) {
    const fragment = applyPrivateScope(rawFragment);
    const { baseNode, themeNodes } = normalizeTokenNode(fragment);
    resolved.baseTokens = deepMerge({}, resolved.baseTokens, baseNode);
    if (themeNodes.light && hasKeys(themeNodes.light)) {
      resolved.themes.light = {
        tokens: deepMerge(
          {},
          resolved.themes.light?.tokens ?? {},
          themeNodes.light
        )
      };
    }
    if (themeNodes.dark && hasKeys(themeNodes.dark)) {
      resolved.themes.dark = {
        tokens: deepMerge(
          {},
          resolved.themes.dark?.tokens ?? {},
          themeNodes.dark
        )
      };
    }
  }
  return resolved;
}
__name(resolveColorModeTokens, "resolveColorModeTokens");

// ../reference-core/src/system/panda/config/extensions/r/createRExtension.ts
function createRExtension(breakpoints) {
  const tableLiteral = JSON.stringify(breakpoints);
  const transformBody = `
    var BREAKPOINT_TABLE = ${tableLiteral};
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
  `;
  const transform = new Function("props", transformBody);
  return {
    properties: {
      r: { type: "object" }
    },
    transform
  };
}
__name(createRExtension, "createRExtension");

// ../reference-core/src/system/panda/config/extensions/api/extractBreakpointTable.ts
var PX_RE = /^\s*(-?\d+(?:\.\d+)?)\s*px\s*$/i;
var NUMERIC_RE = /^\s*(-?\d+(?:\.\d+)?)\s*$/;
function normalizeWidth(name, raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(raw);
  }
  if (typeof raw !== "string") {
    throw new Error(
      `[reference-ui] tokens({ breakpoints: { ${name}: ... } }) must be a string in the form "<n>px" (got ${typeof raw}).`
    );
  }
  const px = raw.match(PX_RE);
  if (px) return px[1];
  const num = raw.match(NUMERIC_RE);
  if (num) return num[1];
  throw new Error(
    `[reference-ui] Breakpoint "${name}" must be expressed in px (got "${raw}"). Container queries require pixel widths.`
  );
}
__name(normalizeWidth, "normalizeWidth");
function extractBreakpointTable(fragments) {
  const table = {};
  for (const fragment of fragments) {
    if (!fragment || typeof fragment !== "object") continue;
    const breakpoints = fragment.breakpoints;
    if (!breakpoints || typeof breakpoints !== "object") continue;
    for (const [name, entry] of Object.entries(breakpoints)) {
      if (entry && typeof entry === "object" && "value" in entry) {
        table[name] = normalizeWidth(name, entry.value);
      } else {
        table[name] = normalizeWidth(name, entry);
      }
    }
  }
  return table;
}
__name(extractBreakpointTable, "extractBreakpointTable");

// ../reference-core/src/system/panda/config/diagnostics/types.ts
var CONFIG_DIAGNOSTIC_WARN_GLOBAL_KEY = "__refConfigDiagnosticWarn";
var CONFIG_DIAGNOSTIC_CACHE_KEY = "__refConfigDiagnosticWarnings";
var MAX_CONFIG_COLLISIONS_TO_PRINT = 10;
function getConfigFragmentSource(value) {
  if (value === null || typeof value !== "object") return void 0;
  const source = value[CONFIG_FRAGMENT_SOURCE_PROPERTY];
  return typeof source === "string" ? source : void 0;
}
__name(getConfigFragmentSource, "getConfigFragmentSource");
function getConfigFragmentSourceLabel(value) {
  return getConfigFragmentSource(value) ?? "unknown source";
}
__name(getConfigFragmentSourceLabel, "getConfigFragmentSourceLabel");
function isUserspaceConfigFragment(value) {
  const source = getConfigFragmentSource(value);
  return typeof source === "string" && source !== "upstream system fragment";
}
__name(isUserspaceConfigFragment, "isUserspaceConfigFragment");
function warnConfigDiagnostic(message) {
  const runtime = globalThis;
  const cache = runtime[CONFIG_DIAGNOSTIC_CACHE_KEY] instanceof Set ? runtime[CONFIG_DIAGNOSTIC_CACHE_KEY] : /* @__PURE__ */ new Set();
  runtime[CONFIG_DIAGNOSTIC_CACHE_KEY] = cache;
  if (cache.has(message)) return;
  cache.add(message);
  const warn = runtime[CONFIG_DIAGNOSTIC_WARN_GLOBAL_KEY];
  if (typeof warn === "function") {
    warn(message);
    return;
  }
  const fallbackConsole = runtime.console;
  if (fallbackConsole && typeof fallbackConsole === "object" && typeof fallbackConsole.warn === "function") {
    ;
    fallbackConsole.warn(message);
  }
}
__name(warnConfigDiagnostic, "warnConfigDiagnostic");
function withConfigFragmentSource(value, source) {
  Object.defineProperty(value, CONFIG_FRAGMENT_SOURCE_PROPERTY, {
    configurable: true,
    enumerable: false,
    value: source
  });
  return value;
}
__name(withConfigFragmentSource, "withConfigFragmentSource");

// ../reference-core/src/system/panda/config/diagnostics/tokens.ts
function isPlainObject3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject3, "isPlainObject");
function valuesDiffer(left, right) {
  return JSON.stringify(left) !== JSON.stringify(right);
}
__name(valuesDiffer, "valuesDiffer");
function hasDivergentOverlap(left, right) {
  for (const key of Object.keys(left)) {
    if (!(key in right)) continue;
    const leftValue = left[key];
    const rightValue = right[key];
    if (isPlainObject3(leftValue) && isPlainObject3(rightValue)) {
      if (hasDivergentOverlap(leftValue, rightValue)) return true;
      continue;
    }
    if (valuesDiffer(leftValue, rightValue)) return true;
  }
  return false;
}
__name(hasDivergentOverlap, "hasDivergentOverlap");
function hasOverlappingNamespace(left, right) {
  return Object.keys(left).some((key) => key in right);
}
__name(hasOverlappingNamespace, "hasOverlappingNamespace");
function collectCollisionPaths(left, right, path = [], collisions = /* @__PURE__ */ new Set()) {
  for (const key of Object.keys(left)) {
    const leftValue = left[key];
    const rightValue = right[key];
    if (!isPlainObject3(leftValue) || !isPlainObject3(rightValue)) continue;
    const nextPath = [...path, key];
    if (nextPath.length >= 2 && hasDivergentOverlap(leftValue, rightValue)) {
      collisions.add(nextPath.join("."));
      continue;
    }
    collectCollisionPaths(leftValue, rightValue, nextPath, collisions);
  }
  return collisions;
}
__name(collectCollisionPaths, "collectCollisionPaths");
function collectRepeatedNamespacePaths(left, right, path = [], collisions = /* @__PURE__ */ new Set()) {
  for (const key of Object.keys(left)) {
    const leftValue = left[key];
    const rightValue = right[key];
    if (!isPlainObject3(leftValue) || !isPlainObject3(rightValue)) continue;
    const nextPath = [...path, key];
    if (nextPath.length >= 2 && hasOverlappingNamespace(leftValue, rightValue)) {
      collisions.add(nextPath.join("."));
      continue;
    }
    collectRepeatedNamespacePaths(leftValue, rightValue, nextPath, collisions);
  }
  return collisions;
}
__name(collectRepeatedNamespacePaths, "collectRepeatedNamespacePaths");
function sourceLabel(value) {
  return getConfigFragmentSourceLabel(value);
}
__name(sourceLabel, "sourceLabel");
function findTokenCollisions(fragments) {
  const collisionMap = /* @__PURE__ */ new Map();
  for (let index = 0; index < fragments.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < fragments.length; compareIndex += 1) {
      const left = fragments[index];
      const right = fragments[compareIndex];
      if (!left || !right) continue;
      if (!isUserspaceConfigFragment(left) || !isUserspaceConfigFragment(right)) continue;
      const paths = collectCollisionPaths(left, right);
      if (paths.size === 0) {
        collectRepeatedNamespacePaths(left, right).forEach((path) => paths.add(path));
      }
      for (const path of paths) {
        const sources = collisionMap.get(path) ?? /* @__PURE__ */ new Set();
        sources.add(sourceLabel(left));
        sources.add(sourceLabel(right));
        collisionMap.set(path, sources);
      }
    }
  }
  return [...collisionMap.entries()].map(([path, sources]) => ({ path, sources: [...sources].sort() })).sort((a, b) => a.path.localeCompare(b.path));
}
__name(findTokenCollisions, "findTokenCollisions");
function createTokenCollisionWarning(collisions) {
  const shown = collisions.slice(0, MAX_CONFIG_COLLISIONS_TO_PRINT);
  const hiddenCount = collisions.length - shown.length;
  const details = shown.map(
    (collision, index) => [
      `  ${index + 1}. ${collision.path}`,
      ...collision.sources.map((source) => `     - ${source}`)
    ].join("\n")
  ).join("\n");
  const suffix = hiddenCount > 0 ? `
  ... and ${hiddenCount} more` : "";
  return [
    "[tokens] Token namespace collisions detected.",
    "Reference UI deep-merges tokens, so later tokens() fragments may override earlier values.",
    "",
    "Colliding namespaces:",
    `${details}${suffix}`,
    "",
    "Consider keeping each colliding namespace in one file, or make the override intentional."
  ].join("\n");
}
__name(createTokenCollisionWarning, "createTokenCollisionWarning");
function warnOnTokenCollisions(fragments) {
  const collisions = findTokenCollisions(fragments);
  if (collisions.length === 0) return;
  warnConfigDiagnostic(createTokenCollisionWarning(collisions));
}
__name(warnOnTokenCollisions, "warnOnTokenCollisions");

// ../reference-core/src/system/panda/config/diagnostics/config.ts
function collectNamedCollisions(entries) {
  const sourcesByName = /* @__PURE__ */ new Map();
  const countsByName = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    sourcesByName.set(entry.name, sourcesByName.get(entry.name) ?? /* @__PURE__ */ new Set());
    sourcesByName.get(entry.name)?.add(entry.source);
    countsByName.set(entry.name, (countsByName.get(entry.name) ?? 0) + 1);
  }
  return [...sourcesByName.entries()].filter(([name]) => (countsByName.get(name) ?? 0) > 1).map(([name, sources]) => ({ name, sources: [...sources].sort() })).sort((left, right) => left.name.localeCompare(right.name));
}
__name(collectNamedCollisions, "collectNamedCollisions");
function createNamedCollisionWarning(input) {
  const shown = input.collisions.slice(0, MAX_CONFIG_COLLISIONS_TO_PRINT);
  const hiddenCount = input.collisions.length - shown.length;
  const details = shown.map(
    (collision, index) => [
      `  ${index + 1}. ${collision.name}`,
      ...collision.sources.map((source) => `     - ${source}`)
    ].join("\n")
  ).join("\n");
  const suffix = hiddenCount > 0 ? `
  ... and ${hiddenCount} more` : "";
  return [
    `[${input.label}] ${input.noun} collisions detected.`,
    input.description,
    "",
    `Colliding ${input.noun.toLowerCase()}:`,
    `${details}${suffix}`,
    "",
    input.recommendation
  ].join("\n");
}
__name(createNamedCollisionWarning, "createNamedCollisionWarning");
function warnOnFontCollisions(fonts) {
  const collisions = collectNamedCollisions(
    fonts.filter(isUserspaceConfigFragment).map((font) => ({
      name: font.name,
      source: getConfigFragmentSourceLabel(font)
    }))
  );
  if (collisions.length === 0) return;
  warnConfigDiagnostic(
    createNamedCollisionWarning({
      label: "fonts",
      noun: "Font",
      description: "Reference UI merges font() definitions by name, so later definitions may override tokens, font faces, recipes, and pattern behavior.",
      recommendation: "Consider keeping each font name in one file, or rename one definition if both are meant to coexist.",
      collisions
    })
  );
}
__name(warnOnFontCollisions, "warnOnFontCollisions");
function getKeyframeCollisionEntries(fragments) {
  return fragments.flatMap((fragment) => {
    if (!isUserspaceConfigFragment(fragment)) return [];
    const source = getConfigFragmentSourceLabel(fragment);
    return Object.keys(fragment).map((name) => ({ name, source }));
  });
}
__name(getKeyframeCollisionEntries, "getKeyframeCollisionEntries");
function warnOnKeyframeCollisions(fragments) {
  const collisions = collectNamedCollisions(getKeyframeCollisionEntries(fragments));
  if (collisions.length === 0) return;
  warnConfigDiagnostic(
    createNamedCollisionWarning({
      label: "keyframes",
      noun: "Keyframe",
      description: "Reference UI deep-merges keyframes fragments, so repeated keyframe names may override animation steps.",
      recommendation: "Consider keeping each keyframe name in one file, or rename one animation if both are meant to coexist.",
      collisions
    })
  );
}
__name(warnOnKeyframeCollisions, "warnOnKeyframeCollisions");
function warnOnConfigCollisions(input) {
  warnOnTokenCollisions(input.tokens ?? []);
  warnOnFontCollisions(input.fonts ?? []);
  warnOnKeyframeCollisions(input.keyframes ?? []);
}
__name(warnOnConfigCollisions, "warnOnConfigCollisions");

// ../reference-core/src/system/panda/config/extensions/rhythm/helpers.ts
var import_postcss_value_parser2 = __toESM(require_lib(), 1);

// ../reference-core/src/system/panda/config/extensions/rhythm/get-rhythm.ts
function getRhythm(num, denom) {
  if (denom !== void 0) {
    return num === 1 ? `calc(var(--spacing-root) / ${denom})` : `calc(${num} * var(--spacing-root) / ${denom})`;
  }
  if (num === 1) return "var(--spacing-root)";
  return `calc(${num} * var(--spacing-root))`;
}
__name(getRhythm, "getRhythm");

// ../reference-core/src/system/panda/config/extensions/rhythm/helpers.ts
function parseRhythmFraction(value) {
  const slashIndex = value.indexOf("/");
  if (slashIndex <= 0 || slashIndex !== value.lastIndexOf("/")) {
    return void 0;
  }
  const numerator = Number(value.slice(0, slashIndex));
  const denominator = Number(value.slice(slashIndex + 1));
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return void 0;
  }
  return [numerator, denominator];
}
__name(parseRhythmFraction, "parseRhythmFraction");
function resolveSingleRhythmValue(value) {
  if (!value.endsWith("r")) {
    return void 0;
  }
  const rhythmValue = value.slice(0, -1);
  if (rhythmValue === "" || rhythmValue === "+") {
    return getRhythm(1);
  }
  if (rhythmValue === "-") {
    return "calc(-1 * var(--spacing-root))";
  }
  const fraction = parseRhythmFraction(rhythmValue);
  if (fraction) {
    return getRhythm(fraction[0], fraction[1]);
  }
  const n = Number(rhythmValue);
  if (!Number.isNaN(n)) {
    return getRhythm(n);
  }
  return void 0;
}
__name(resolveSingleRhythmValue, "resolveSingleRhythmValue");
function transformNodes(nodes) {
  let changed = false;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "function") {
      const name = node.value.toLowerCase();
      if (name === "var" || name === "url" || name === "env") {
        continue;
      }
      if (node.nodes && node.nodes.length > 0) {
        if (transformNodes(node.nodes)) {
          changed = true;
        }
      }
      continue;
    }
    const next = nodes[i + 1];
    const nextNext = nodes[i + 2];
    if (node.type === "word" && next?.type === "div" && next.value === "/" && next.before === "" && next.after === "" && nextNext?.type === "word" && nextNext.value.endsWith("r") && node.sourceEndIndex === next.sourceIndex && next.sourceEndIndex === nextNext.sourceIndex) {
      const prevNode = nodes[i - 1];
      const isInvalidPrefix = prevNode?.type === "div" && prevNode.value === "/" && prevNode.after === "";
      if (!isInvalidPrefix) {
        const denomStr = nextNext.value.slice(0, -1);
        const fractionStr = `${node.value}/${denomStr}`;
        const fraction = parseRhythmFraction(fractionStr);
        if (fraction) {
          const resolved = getRhythm(fraction[0], fraction[1]);
          nodes.splice(i, 3, {
            type: "word",
            sourceIndex: node.sourceIndex,
            sourceEndIndex: nextNext.sourceEndIndex,
            value: resolved
          });
          changed = true;
          continue;
        }
      }
    }
    if (node.type === "word") {
      const prevNode = nodes[i - 1];
      const isDirectSlashChild = prevNode?.type === "div" && prevNode.value === "/" && prevNode.after === "";
      if (!isDirectSlashChild) {
        const resolved = resolveSingleRhythmValue(node.value);
        if (resolved !== void 0) {
          node.value = resolved;
          changed = true;
        }
      }
    }
  }
  return changed;
}
__name(transformNodes, "transformNodes");
function resolveRhythm(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.includes("r")) {
    return value;
  }
  const parsed = (0, import_postcss_value_parser2.default)(value);
  const changed = transformNodes(parsed.nodes);
  return changed ? parsed.toString() : value;
}
__name(resolveRhythm, "resolveRhythm");

// ../reference-core/src/system/panda/config/extensions/shorthands/parser.ts
var import_postcss_value_parser3 = __toESM(require_lib(), 1);

// ../reference-core/src/system/panda/config/extensions/color/utilities.ts
var CSS_COLOR_KEYWORDS = /* @__PURE__ */ new Set([
  "currentcolor",
  "inherit",
  "initial",
  "revert",
  "revert-layer",
  "unset",
  "transparent",
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkgrey",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkslategrey",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dimgrey",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "grey",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightgrey",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightslategrey",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "slategrey",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen"
]);
function resolveColorToken(value, args) {
  if (typeof value === "string") {
    if (value.startsWith("colors.")) {
      const stripped = value.slice(7);
      const resolved2 = args?.token?.(value) ?? args?.token?.(`colors.${stripped}`) ?? args?.token?.(stripped);
      if (resolved2) {
        return resolved2;
      }
      if (CSS_COLOR_KEYWORDS.has(stripped.toLowerCase())) {
        return stripped;
      }
      if (/^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/i.test(stripped)) {
        const varName = "--colors-" + stripped.replace(/\./g, "-");
        return `var(${varName})`;
      }
      return stripped;
    }
    const resolved = args?.token?.(`colors.${value}`) ?? args?.token?.(value);
    if (resolved) {
      return resolved;
    }
  }
  return value;
}
__name(resolveColorToken, "resolveColorToken");
function createColorMixTransform(prop) {
  return (value, args) => {
    if (typeof value === "string") {
      if (value.includes("/")) {
        const normalized = value.startsWith("colors.") ? value.slice(7) : value;
        const mix = args?.utils?.colorMix ? args.utils.colorMix(normalized) : void 0;
        if (mix && !mix.invalid) {
          const cssVar = "--mix-" + prop;
          return {
            [cssVar]: mix.value,
            [prop]: `var(${cssVar}, ${mix.color})`
          };
        }
      }
      const resolved = resolveColorToken(value, args);
      if (resolved !== value) {
        return { [prop]: resolved };
      }
    }
    return { [prop]: value };
  };
}
__name(createColorMixTransform, "createColorMixTransform");
var colorUtilities = {
  background: {
    shorthand: "bg",
    className: "bg",
    values: "colors",
    group: "Background",
    transform: createColorMixTransform("background")
  },
  backgroundColor: {
    shorthand: "bgColor",
    className: "bg-c",
    values: "colors",
    group: "Background",
    transform: createColorMixTransform("backgroundColor")
  },
  borderColor: {
    shorthand: "borderC",
    className: "bd-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderColor")
  },
  borderInlineColor: {
    shorthand: "borderXC",
    className: "bd-x-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderInlineColor")
  },
  borderBlockColor: {
    shorthand: "borderYC",
    className: "bd-y-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderBlockColor")
  },
  borderLeftColor: {
    className: "bd-l-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderLeftColor")
  },
  borderInlineStartColor: {
    shorthand: "borderStartC",
    className: "bd-s-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderInlineStartColor")
  },
  borderRightColor: {
    className: "bd-r-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderRightColor")
  },
  borderInlineEndColor: {
    shorthand: "borderEndC",
    className: "bd-e-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderInlineEndColor")
  },
  borderTopColor: {
    className: "bd-t-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderTopColor")
  },
  borderBottomColor: {
    className: "bd-b-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderBottomColor")
  },
  borderBlockEndColor: {
    className: "bd-be-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderBlockEndColor")
  },
  borderBlockStartColor: {
    className: "bd-bs-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderBlockStartColor")
  },
  color: {
    shorthand: "c",
    className: "c",
    values: "colors",
    group: "Color",
    transform: createColorMixTransform("color")
  },
  fill: {
    className: "fill",
    values: "colors",
    group: "Color",
    transform: createColorMixTransform("fill")
  },
  stroke: {
    className: "stroke",
    values: "colors",
    group: "Color",
    transform: createColorMixTransform("stroke")
  },
  outlineColor: {
    shorthand: "ringColor",
    className: "ring-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("outlineColor")
  },
  accentColor: {
    className: "accent-c",
    values: "colors",
    group: "Color",
    transform: createColorMixTransform("accentColor")
  },
  caretColor: {
    className: "caret-c",
    values: "colors",
    group: "Color",
    transform: createColorMixTransform("caretColor")
  },
  textDecorationColor: {
    className: "text-decor-c",
    values: "colors",
    group: "Typography",
    transform: createColorMixTransform("textDecorationColor")
  },
  textEmphasisColor: {
    className: "text-emphasis-c",
    values: "colors",
    group: "Typography",
    transform: createColorMixTransform("textEmphasisColor")
  },
  divideColor: {
    className: "divide-c",
    values: "colors",
    group: "Border",
    transform: createColorMixTransform("borderColor")
  },
  scrollbarColor: {
    className: "scrollbar-c",
    values: "colors",
    group: "Scrollbar",
    transform: createColorMixTransform("scrollbarColor")
  }
};

// ../reference-core/src/system/panda/config/extensions/shorthands/parser.ts
var CSS_GLOBAL_KEYWORDS = /* @__PURE__ */ new Set([
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer"
]);
var BORDER_STYLES = /* @__PURE__ */ new Set([
  "none",
  "hidden",
  "dotted",
  "dashed",
  "solid",
  "double",
  "groove",
  "ridge",
  "inset",
  "outset"
]);
var OUTLINE_STYLES = /* @__PURE__ */ new Set([
  ...BORDER_STYLES,
  "auto"
]);
function isGlobalCssKeyword(val) {
  return CSS_GLOBAL_KEYWORDS.has(val.trim().toLowerCase());
}
__name(isGlobalCssKeyword, "isGlobalCssKeyword");
function isBorderStyle(val) {
  return BORDER_STYLES.has(val.trim().toLowerCase());
}
__name(isBorderStyle, "isBorderStyle");
function isOutlineStyle(val) {
  return OUTLINE_STYLES.has(val.trim().toLowerCase());
}
__name(isOutlineStyle, "isOutlineStyle");
function isLengthWidth(val) {
  const lower = val.trim().toLowerCase();
  if (lower === "r" || lower === "+r" || lower === "-r") {
    return true;
  }
  if (/^(\d+(\.\d+)?|\.\d+)(px|rem|em|r|%|vh|vw|ch|vmin|vmax|cqw|cqh|pt|pc|ex|dvh|lvh|svh)$/.test(lower)) {
    return true;
  }
  if (/^[-+]?(\d+(\.\d+)?|\.\d+)\/[-+]?(\d+(\.\d+)?|\.\d+)r$/.test(lower)) {
    return true;
  }
  if (lower === "thin" || lower === "medium" || lower === "thick") {
    return true;
  }
  if (/^(\d+(\.\d+)?|\.\d+)$/.test(lower)) {
    return true;
  }
  if (/^(calc|min|max|clamp)\(/i.test(lower) && lower.endsWith(")")) {
    return true;
  }
  return false;
}
__name(isLengthWidth, "isLengthWidth");
function resolveWidth(val) {
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "r" || lower === "+r") {
    return "var(--spacing-root)";
  }
  if (lower === "-r") {
    return "calc(-1 * var(--spacing-root))";
  }
  if (/^(\d+(\.\d+)?|\.\d+)$/.test(trimmed)) {
    return `${trimmed}px`;
  }
  return String(resolveRhythm(trimmed));
}
__name(resolveWidth, "resolveWidth");
function splitShorthandTokens(str) {
  if (!str) return [];
  const parsed = (0, import_postcss_value_parser3.default)(str.trim());
  const tokens = [];
  let currentGroup = [];
  for (const node of parsed.nodes) {
    if (node.type === "space") {
      if (currentGroup.length > 0) {
        tokens.push(import_postcss_value_parser3.default.stringify(currentGroup));
        currentGroup = [];
      }
    } else {
      currentGroup.push(node);
    }
  }
  if (currentGroup.length > 0) {
    tokens.push(import_postcss_value_parser3.default.stringify(currentGroup));
  }
  return tokens;
}
__name(splitShorthandTokens, "splitShorthandTokens");
function isWholeShorthandValue(val) {
  const trimmed = val.trim().toLowerCase();
  if (isGlobalCssKeyword(trimmed)) return true;
  if (trimmed.startsWith("var(") && trimmed.endsWith(")")) return true;
  if (trimmed.startsWith("borders.") || trimmed.startsWith("outlines.")) return true;
  return false;
}
__name(isWholeShorthandValue, "isWholeShorthandValue");
function parseShorthandTokens(tokens, options) {
  let width;
  let style;
  let color;
  const isStyle = options?.isOutline ? isOutlineStyle : isBorderStyle;
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (isStyle(lower)) {
      if (!style) {
        style = lower;
      }
    } else if (isLengthWidth(t)) {
      if (!width) {
        width = resolveWidth(t);
      }
    } else if (!color) {
      color = t;
    }
  }
  return { width, style, color };
}
__name(parseShorthandTokens, "parseShorthandTokens");
function resolveShorthandColor(color, args) {
  if (color.includes("/") && args?.utils?.colorMix) {
    const normalized = color.startsWith("colors.") ? color.slice(7) : color;
    const mix = args.utils.colorMix(normalized);
    if (mix && !mix.invalid) {
      return mix.value;
    }
  }
  const resolved = resolveColorToken(color, args);
  return typeof resolved === "string" ? resolved : color;
}
__name(resolveShorthandColor, "resolveShorthandColor");

// ../reference-core/src/system/panda/config/extensions/shorthands/factory.ts
function createShorthandUtility(cfg) {
  const values = cfg.values ?? "borders";
  const group = cfg.group ?? "Border";
  return {
    shorthand: cfg.shorthand,
    className: cfg.className,
    values,
    group,
    transform: /* @__PURE__ */ __name((value, args) => {
      const raw = typeof args.raw === "string" ? args.raw : value;
      if (raw === 0 || raw === "0" || typeof raw === "string" && /^0(px|rem|em|%)?$/.test(raw.trim())) {
        return { [cfg.widthProp]: "0px" };
      }
      if (typeof raw !== "string") {
        return { [cfg.mainProp]: value };
      }
      const trimmed = raw.trim();
      if (trimmed === "none") {
        if (cfg.noneValue !== void 0) {
          return typeof cfg.noneValue === "string" ? { [cfg.mainProp]: cfg.noneValue } : cfg.noneValue;
        }
        return { [cfg.mainProp]: "none" };
      }
      if (isWholeShorthandValue(trimmed)) {
        return { [cfg.mainProp]: value };
      }
      const tokens = splitShorthandTokens(trimmed);
      if (tokens.length === 0) {
        return { [cfg.mainProp]: value };
      }
      const { width, style, color } = parseShorthandTokens(tokens, {
        isOutline: cfg.isOutline
      });
      if (!style && !width && !color) {
        return { [cfg.mainProp]: value };
      }
      const result = {};
      if (width) {
        result[cfg.widthProp] = width;
      }
      if (style) {
        result[cfg.styleProp] = style;
      }
      if (color) {
        result[cfg.colorProp] = resolveShorthandColor(color, args);
      }
      return result;
    }, "transform")
  };
}
__name(createShorthandUtility, "createShorthandUtility");

// ../reference-core/src/system/panda/config/extensions/shorthands/border.ts
var borderShorthandUtilities = {
  border: createShorthandUtility({
    shorthand: "b",
    className: "bd",
    mainProp: "border",
    widthProp: "borderWidth",
    styleProp: "borderStyle",
    colorProp: "borderColor"
  }),
  borderTop: createShorthandUtility({
    shorthand: "borderT",
    className: "bd-t",
    mainProp: "borderTop",
    widthProp: "borderTopWidth",
    styleProp: "borderTopStyle",
    colorProp: "borderTopColor"
  }),
  borderRight: createShorthandUtility({
    shorthand: "borderR",
    className: "bd-r",
    mainProp: "borderRight",
    widthProp: "borderRightWidth",
    styleProp: "borderRightStyle",
    colorProp: "borderRightColor"
  }),
  borderBottom: createShorthandUtility({
    shorthand: "borderB",
    className: "bd-b",
    mainProp: "borderBottom",
    widthProp: "borderBottomWidth",
    styleProp: "borderBottomStyle",
    colorProp: "borderBottomColor"
  }),
  borderLeft: createShorthandUtility({
    shorthand: "borderL",
    className: "bd-l",
    mainProp: "borderLeft",
    widthProp: "borderLeftWidth",
    styleProp: "borderLeftStyle",
    colorProp: "borderLeftColor"
  }),
  borderInline: createShorthandUtility({
    shorthand: ["borderX", "borderInline"],
    className: "bd-x",
    mainProp: "borderInline",
    widthProp: "borderInlineWidth",
    styleProp: "borderInlineStyle",
    colorProp: "borderInlineColor"
  }),
  borderBlock: createShorthandUtility({
    shorthand: ["borderY", "borderBlock"],
    className: "bd-y",
    mainProp: "borderBlock",
    widthProp: "borderBlockWidth",
    styleProp: "borderBlockStyle",
    colorProp: "borderBlockColor"
  }),
  borderInlineStart: createShorthandUtility({
    shorthand: "borderStart",
    className: "bd-s",
    mainProp: "borderInlineStart",
    widthProp: "borderInlineStartWidth",
    styleProp: "borderInlineStartStyle",
    colorProp: "borderInlineStartColor"
  }),
  borderInlineEnd: createShorthandUtility({
    shorthand: "borderEnd",
    className: "bd-e",
    mainProp: "borderInlineEnd",
    widthProp: "borderInlineEndWidth",
    styleProp: "borderInlineEndStyle",
    colorProp: "borderInlineEndColor"
  }),
  borderBlockStart: createShorthandUtility({
    className: "bd-bs",
    mainProp: "borderBlockStart",
    widthProp: "borderBlockStartWidth",
    styleProp: "borderBlockStartStyle",
    colorProp: "borderBlockStartColor"
  }),
  borderBlockEnd: createShorthandUtility({
    className: "bd-be",
    mainProp: "borderBlockEnd",
    widthProp: "borderBlockEndWidth",
    styleProp: "borderBlockEndStyle",
    colorProp: "borderBlockEndColor"
  })
};

// ../reference-core/src/system/panda/config/extensions/rhythm/border.ts
function resolveBorderRadiusValue(value, args) {
  const raw = typeof args.raw === "string" ? args.raw : value;
  if (typeof raw === "string" && raw.includes("r")) {
    const resolved = resolveRhythm(raw);
    if (resolved !== raw) {
      return resolved;
    }
  }
  if (typeof raw === "string") {
    const tokenKey = raw.startsWith("radii.") ? raw.slice(6) : raw;
    const token = args.token(`radii.${tokenKey}`) ?? args.token(tokenKey);
    if (token) return token;
    if (raw.startsWith("radii.")) {
      return `var(--radii-${tokenKey.replace(/\./g, "-")})`;
    }
    return value;
  }
  return value;
}
__name(resolveBorderRadiusValue, "resolveBorderRadiusValue");
var rhythmBorderRadius = /* @__PURE__ */ __name((property) => ({
  property,
  values: "radii",
  transform: /* @__PURE__ */ __name((value, args) => ({
    [property]: resolveBorderRadiusValue(value, args)
  }), "transform")
}), "rhythmBorderRadius");
var rhythmBorderRadiusPair = /* @__PURE__ */ __name((a, b) => ({
  property: a,
  values: "radii",
  transform: /* @__PURE__ */ __name((value, args) => {
    const resolved = resolveBorderRadiusValue(value, args);
    return { [a]: resolved, [b]: resolved };
  }, "transform")
}), "rhythmBorderRadiusPair");
var rhythmBorderRadiusUtilities = {
  borderRadius: rhythmBorderRadius("borderRadius"),
  borderTopLeftRadius: rhythmBorderRadius("borderTopLeftRadius"),
  borderTopRightRadius: rhythmBorderRadius("borderTopRightRadius"),
  borderBottomRightRadius: rhythmBorderRadius("borderBottomRightRadius"),
  borderBottomLeftRadius: rhythmBorderRadius("borderBottomLeftRadius"),
  borderTopRadius: rhythmBorderRadiusPair(
    "borderTopLeftRadius",
    "borderTopRightRadius"
  ),
  borderRightRadius: rhythmBorderRadiusPair(
    "borderTopRightRadius",
    "borderBottomRightRadius"
  ),
  borderBottomRadius: rhythmBorderRadiusPair(
    "borderBottomLeftRadius",
    "borderBottomRightRadius"
  ),
  borderLeftRadius: rhythmBorderRadiusPair(
    "borderTopLeftRadius",
    "borderBottomLeftRadius"
  ),
  borderStartStartRadius: rhythmBorderRadius("borderStartStartRadius"),
  borderStartEndRadius: rhythmBorderRadius("borderStartEndRadius"),
  borderEndStartRadius: rhythmBorderRadius("borderEndStartRadius"),
  borderEndEndRadius: rhythmBorderRadius("borderEndEndRadius"),
  borderStartRadius: rhythmBorderRadiusPair(
    "borderStartStartRadius",
    "borderEndStartRadius"
  ),
  borderEndRadius: rhythmBorderRadiusPair(
    "borderStartEndRadius",
    "borderEndEndRadius"
  )
};

// ../reference-core/src/system/panda/config/extensions/shorthands/outline.ts
function createOutlineShorthandUtility(cfg = {}) {
  return createShorthandUtility({
    shorthand: cfg.shorthand ?? "ring",
    className: cfg.className ?? "ring",
    values: cfg.values ?? "borders",
    group: cfg.group ?? "Border",
    mainProp: cfg.mainProp ?? "outline",
    widthProp: cfg.widthProp ?? "outlineWidth",
    styleProp: cfg.styleProp ?? "outlineStyle",
    colorProp: cfg.colorProp ?? "outlineColor",
    isOutline: true,
    noneValue: cfg.noneValue ?? {
      outline: "2px solid transparent",
      outlineOffset: "2px"
    }
  });
}
__name(createOutlineShorthandUtility, "createOutlineShorthandUtility");
var outlineShorthandUtilities = {
  outline: createOutlineShorthandUtility()
};

// ../reference-core/src/system/panda/config/extensions/shorthands/index.ts
var shorthandUtilities = {
  ...borderShorthandUtilities,
  ...outlineShorthandUtilities
};

// ../reference-core/src/system/panda/config/extensions/size/styles.ts
function sizeStyles(value) {
  return {
    width: value,
    height: value
  };
}
__name(sizeStyles, "sizeStyles");

// ../reference-core/src/system/panda/config/extensions/rhythm/utilities.ts
var rhythmTransform = /* @__PURE__ */ __name((property, values = "spacing") => ({
  property,
  values,
  transform: /* @__PURE__ */ __name((value) => ({ [property]: resolveRhythm(value) }), "transform")
}), "rhythmTransform");
var rhythmSizeTransform = {
  property: "size",
  values: "spacing",
  transform: /* @__PURE__ */ __name((value) => sizeStyles(resolveRhythm(value)), "transform")
};
var rhythmUtilities = {
  width: rhythmTransform("width"),
  height: rhythmTransform("height"),
  size: rhythmSizeTransform,
  fontSize: rhythmTransform("fontSize"),
  lineHeight: rhythmTransform("lineHeight"),
  letterSpacing: rhythmTransform("letterSpacing"),
  padding: rhythmTransform("padding"),
  paddingTop: rhythmTransform("paddingTop"),
  paddingBottom: rhythmTransform("paddingBottom"),
  paddingLeft: rhythmTransform("paddingLeft"),
  paddingRight: rhythmTransform("paddingRight"),
  paddingInline: rhythmTransform("paddingInline"),
  paddingInlineStart: rhythmTransform("paddingInlineStart"),
  paddingInlineEnd: rhythmTransform("paddingInlineEnd"),
  paddingBlock: rhythmTransform("paddingBlock"),
  paddingBlockStart: rhythmTransform("paddingBlockStart"),
  paddingBlockEnd: rhythmTransform("paddingBlockEnd"),
  margin: rhythmTransform("margin"),
  marginTop: rhythmTransform("marginTop"),
  marginBottom: rhythmTransform("marginBottom"),
  marginLeft: rhythmTransform("marginLeft"),
  marginRight: rhythmTransform("marginRight"),
  marginInline: rhythmTransform("marginInline"),
  marginInlineStart: rhythmTransform("marginInlineStart"),
  marginInlineEnd: rhythmTransform("marginInlineEnd"),
  marginBlock: rhythmTransform("marginBlock"),
  marginBlockStart: rhythmTransform("marginBlockStart"),
  marginBlockEnd: rhythmTransform("marginBlockEnd"),
  gap: rhythmTransform("gap"),
  rowGap: rhythmTransform("rowGap"),
  columnGap: rhythmTransform("columnGap"),
  gridGap: rhythmTransform("gridGap"),
  gridRowGap: rhythmTransform("gridRowGap"),
  gridColumnGap: rhythmTransform("gridColumnGap"),
  inset: rhythmTransform("inset"),
  insetBlock: rhythmTransform("insetBlock"),
  insetBlockStart: rhythmTransform("insetBlockStart"),
  insetBlockEnd: rhythmTransform("insetBlockEnd"),
  insetInline: rhythmTransform("insetInline"),
  insetInlineStart: rhythmTransform("insetInlineStart"),
  insetInlineEnd: rhythmTransform("insetInlineEnd"),
  top: rhythmTransform("top"),
  right: rhythmTransform("right"),
  bottom: rhythmTransform("bottom"),
  left: rhythmTransform("left"),
  scrollMargin: rhythmTransform("scrollMargin"),
  scrollMarginTop: rhythmTransform("scrollMarginTop"),
  scrollMarginRight: rhythmTransform("scrollMarginRight"),
  scrollMarginBottom: rhythmTransform("scrollMarginBottom"),
  scrollMarginLeft: rhythmTransform("scrollMarginLeft"),
  scrollMarginBlock: rhythmTransform("scrollMarginBlock"),
  scrollMarginBlockStart: rhythmTransform("scrollMarginBlockStart"),
  scrollMarginBlockEnd: rhythmTransform("scrollMarginBlockEnd"),
  scrollMarginInline: rhythmTransform("scrollMarginInline"),
  scrollMarginInlineStart: rhythmTransform("scrollMarginInlineStart"),
  scrollMarginInlineEnd: rhythmTransform("scrollMarginInlineEnd"),
  scrollPadding: rhythmTransform("scrollPadding"),
  scrollPaddingTop: rhythmTransform("scrollPaddingTop"),
  scrollPaddingRight: rhythmTransform("scrollPaddingRight"),
  scrollPaddingBottom: rhythmTransform("scrollPaddingBottom"),
  scrollPaddingLeft: rhythmTransform("scrollPaddingLeft"),
  scrollPaddingBlock: rhythmTransform("scrollPaddingBlock"),
  scrollPaddingBlockStart: rhythmTransform("scrollPaddingBlockStart"),
  scrollPaddingBlockEnd: rhythmTransform("scrollPaddingBlockEnd"),
  scrollPaddingInline: rhythmTransform("scrollPaddingInline"),
  scrollPaddingInlineStart: rhythmTransform("scrollPaddingInlineStart"),
  scrollPaddingInlineEnd: rhythmTransform("scrollPaddingInlineEnd"),
  ...rhythmBorderRadiusUtilities,
  ...shorthandUtilities,
  ...colorUtilities,
  borderWidth: rhythmTransform("borderWidth"),
  borderTopWidth: rhythmTransform("borderTopWidth"),
  borderRightWidth: rhythmTransform("borderRightWidth"),
  borderBottomWidth: rhythmTransform("borderBottomWidth"),
  borderLeftWidth: rhythmTransform("borderLeftWidth"),
  borderInlineWidth: rhythmTransform("borderInlineWidth"),
  borderInlineStartWidth: rhythmTransform("borderInlineStartWidth"),
  borderInlineEndWidth: rhythmTransform("borderInlineEndWidth"),
  borderBlockWidth: rhythmTransform("borderBlockWidth"),
  borderBlockStartWidth: rhythmTransform("borderBlockStartWidth"),
  borderBlockEndWidth: rhythmTransform("borderBlockEndWidth"),
  outlineWidth: rhythmTransform("outlineWidth"),
  outlineOffset: rhythmTransform("outlineOffset"),
  textDecorationThickness: rhythmTransform("textDecorationThickness"),
  textUnderlineOffset: rhythmTransform("textUnderlineOffset"),
  borderSpacing: rhythmTransform("borderSpacing"),
  boxShadow: rhythmTransform("boxShadow", "shadows"),
  textShadow: rhythmTransform("textShadow", "shadows")
};

// ../reference-core/src/system/panda/config/extensions/rhythm/globals.ts
var rhythmGlobalCss = {
  ":root": {
    "--spacing-root": "0.25rem"
  }
};

// ../reference-core/src/system/panda/config/extensions/rhythm/tokens.ts
var rhythmSpacingTokens = {
  spacing: {
    px: { value: "1px" },
    r: { value: "var(--spacing-root)" },
    "0.5r": { value: getRhythm(0.5) },
    "1/2r": { value: getRhythm(1, 2) },
    "1/3r": { value: getRhythm(1, 3) },
    "1/4r": { value: getRhythm(1, 4) },
    "1/5r": { value: getRhythm(1, 5) },
    "1/6r": { value: getRhythm(1, 6) },
    "1r": { value: getRhythm(1) },
    "1.5r": { value: getRhythm(1.5) },
    "2r": { value: getRhythm(2) },
    "3r": { value: getRhythm(3) },
    "4r": { value: getRhythm(4) },
    "5r": { value: getRhythm(5) },
    "6r": { value: getRhythm(6) },
    "8r": { value: getRhythm(8) },
    "8.5r": { value: getRhythm(8.5) },
    "10r": { value: getRhythm(10) },
    "12r": { value: getRhythm(12) }
  }
};

// ../reference-core/src/system/panda/config/extensions/index.ts
var defaultTokenFragments = [];
export {
  PANDA_CONFIG_GLOBAL_KEY,
  borderShorthandUtilities,
  buildFontFaces,
  buildFontPatternExtensions,
  buildFontRecipes,
  buildFontTokens,
  colorUtilities,
  createRExtension,
  deepMerge,
  defaultTokenFragments,
  extendFontFaces,
  extendGlobalCss,
  extendKeyframes,
  extendPatterns,
  extendRecipes,
  extendThemes,
  extendTokens,
  extendUtilities,
  extractBreakpointTable,
  getPandaConfig,
  initPandaConfig,
  outlineShorthandUtilities,
  resolveColorModeTokens,
  rhythmGlobalCss,
  rhythmSpacingTokens,
  rhythmUtilities,
  shorthandUtilities,
  warnOnConfigCollisions,
  warnOnTokenCollisions,
  withConfigFragmentSource
};
