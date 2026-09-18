// ../reference-core/src/system/primitives/index.tsx
import * as React4 from "react";

// ../reference-core/src/system/runtime/css/customCssFn.ts
import { css as styledCss } from "@reference-ui/styled/css";

// ../reference-core/src/system/runtime/css/lowerResponsiveStyles.ts
function lowerResponsiveStyles(styles) {
  if (Array.isArray(styles)) {
    return styles.map((style) => lowerResponsiveStyles(style));
  }
  if (!isStyleObject(styles)) {
    return styles;
  }
  return lowerStyleObject(styles);
}
function lowerStyleObject(styles) {
  let changed = false;
  const loweredEntries = [];
  for (const [key, value] of Object.entries(styles)) {
    if (key === "r") {
      const responsiveEntries = lowerResponsiveProperty(value);
      if (responsiveEntries) {
        loweredEntries.push(...responsiveEntries);
        changed = true;
        continue;
      }
    }
    const nextValue = isStyleObject(value) ? lowerStyleObject(value) : value;
    if (nextValue !== value) {
      changed = true;
    }
    loweredEntries.push([key, nextValue]);
  }
  if (!changed) {
    return styles;
  }
  return Object.fromEntries(loweredEntries);
}
function lowerResponsiveProperty(value) {
  if (!isStyleObject(value)) {
    return null;
  }
  const lowered = [];
  for (const [breakpoint, styles] of Object.entries(value)) {
    const width = normalizeBreakpointWidth(breakpoint);
    if (!width || !isStyleObject(styles)) {
      return null;
    }
    lowered.push([
      `@container (min-width: ${width}px)`,
      lowerStyleObject(styles)
    ]);
  }
  return lowered.length > 0 ? lowered : null;
}
function normalizeBreakpointWidth(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return Number.isFinite(Number(trimmed)) ? trimmed : null;
}
function isStyleObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ../reference-core/src/system/runtime/css/customCssFn.ts
function customCssRawFn(...styles) {
  return styledCss.raw(
    ...styles.map((style) => lowerResponsiveStyles(style))
  );
}
function customCssFn(...styles) {
  return styledCss(...styles.map((style) => lowerResponsiveStyles(style)));
}
customCssFn.raw = customCssRawFn;

// ../reference-core/src/system/runtime/recipe/customCvaFn.ts
import { cva as styledCva } from "@reference-ui/styled/css/cva";
var customCvaFn = ((config) => {
  return styledCva(lowerResponsiveRecipeDefinition(config));
});
function lowerResponsiveRecipeDefinition(config) {
  const loweredBase = config.base ? lowerResponsiveStyles(config.base) : config.base;
  const loweredVariants = config.variants ? Object.fromEntries(
    Object.entries(config.variants).map(([variantName, variantValues]) => [
      variantName,
      Object.fromEntries(
        Object.entries(variantValues).map(([variantValue, styles]) => [
          variantValue,
          lowerResponsiveStyles(styles)
        ])
      )
    ])
  ) : config.variants;
  const loweredCompoundVariants = config.compoundVariants?.map((compoundVariant) => ({
    ...compoundVariant,
    css: lowerResponsiveStyles(compoundVariant.css)
  }));
  const loweredConfig = {
    ...config
  };
  if (loweredBase !== void 0) {
    loweredConfig.base = loweredBase;
  }
  if (loweredVariants !== void 0) {
    loweredConfig.variants = loweredVariants;
  }
  if (loweredCompoundVariants !== void 0) {
    loweredConfig.compoundVariants = loweredCompoundVariants;
  }
  return loweredConfig;
}

// ../reference-core/src/system/primitives/index.tsx
import { box } from "@reference-ui/styled/patterns/box";

// ../reference-core/src/system/primitives/shared/constants.ts
var DATA_LAYER_PLACEHOLDER = ["__REFERENCE_UI", "_LAYER_NAME__"].join("");
var DATA_LAYER_NAME = "reference-ui";
var RESOLVED_DATA_LAYER_NAME = DATA_LAYER_NAME === DATA_LAYER_PLACEHOLDER ? void 0 : DATA_LAYER_NAME;
var DATA_COLOR_MODE_ATTR = "data-panda-theme";

// ../reference-core/src/system/primitives/shared/color-mode.ts
import * as React from "react";
var COLOR_MODE_CONTEXT_SYMBOL = /* @__PURE__ */ Symbol.for("@reference-ui/ColorModeContext");
var DOCUMENT_CONTEXT_SYMBOL = /* @__PURE__ */ Symbol.for("@reference-ui/DocumentContext");
var ColorModeContext = globalThis[COLOR_MODE_CONTEXT_SYMBOL] ?? (globalThis[COLOR_MODE_CONTEXT_SYMBOL] = React.createContext(void 0));
var DocumentContext = globalThis[DOCUMENT_CONTEXT_SYMBOL] ?? (globalThis[DOCUMENT_CONTEXT_SYMBOL] = React.createContext(null));
function readDocumentColorMode(doc) {
  const targetDoc = doc ?? (typeof document !== "undefined" ? document : null);
  if (!targetDoc) return void 0;
  return targetDoc.documentElement?.getAttribute(DATA_COLOR_MODE_ATTR) ?? targetDoc.body?.getAttribute(DATA_COLOR_MODE_ATTR) ?? void 0;
}
function useColorMode() {
  const contextMode = React.useContext(ColorModeContext);
  const doc = React.useContext(DocumentContext);
  return contextMode ?? readDocumentColorMode(doc);
}
function resolveColorModeAttr(mode) {
  return mode != null && mode !== "" ? { [DATA_COLOR_MODE_ATTR]: mode } : {};
}

// ../reference-core/src/system/primitives/shared/layers.ts
import * as React2 from "react";
var LAYER_SCOPE_CONTEXT_SYMBOL = /* @__PURE__ */ Symbol.for("@reference-ui/LayerScopeContext");
var LayerScopeContext = globalThis[LAYER_SCOPE_CONTEXT_SYMBOL] ?? (globalThis[LAYER_SCOPE_CONTEXT_SYMBOL] = React2.createContext(false));
function shouldEmitLayerScope({
  inheritsLayerScope,
  hasExplicitColorMode,
  inheritedColorMode,
  layerName = RESOLVED_DATA_LAYER_NAME
}) {
  return Boolean(
    layerName != null && layerName !== "" && (!inheritsLayerScope || hasExplicitColorMode || inheritedColorMode == null)
  );
}
function resolveLayerScopeAttr(shouldEmit, layerName = RESOLVED_DATA_LAYER_NAME) {
  return shouldEmit && layerName ? { "data-layer": layerName } : {};
}

// ../reference-core/src/system/primitives/shared/context.ts
import * as React3 from "react";
function resolvePrimitiveContext({
  inheritsLayerScope,
  inheritedColorMode,
  colorMode,
  variant,
  dataLayerName = RESOLVED_DATA_LAYER_NAME
}) {
  const hasExplicitColorMode = colorMode != null && colorMode !== "";
  const resolvedColorMode = hasExplicitColorMode ? String(colorMode) : inheritedColorMode;
  const shouldEmitDataLayer = shouldEmitLayerScope({
    inheritsLayerScope,
    hasExplicitColorMode,
    inheritedColorMode,
    layerName: dataLayerName
  });
  const dataLayerAttr = resolveLayerScopeAttr(shouldEmitDataLayer, dataLayerName);
  const colorModeAttr = resolveColorModeAttr(resolvedColorMode);
  const variantAttr = variant != null && variant !== "" ? { "data-variant": String(variant) } : {};
  const providesLayerScope = inheritsLayerScope || shouldEmitDataLayer;
  return {
    providesLayerScope,
    resolvedColorMode,
    dataLayerAttr,
    colorModeAttr,
    variantAttr
  };
}
function usePrimitiveContext(colorMode, variant) {
  const inheritsLayerScope = React3.useContext(LayerScopeContext);
  const inheritedColorMode = React3.useContext(ColorModeContext);
  const doc = React3.useContext(DocumentContext);
  const effectiveInheritedColorMode = inheritedColorMode ?? readDocumentColorMode(doc);
  return resolvePrimitiveContext({
    inheritsLayerScope,
    inheritedColorMode: effectiveInheritedColorMode,
    colorMode,
    variant
  });
}

// ../reference-core/src/system/primitives/shared/split-props.ts
import { splitCssProps } from "@reference-ui/styled/jsx";
var BOX_PATTERN_PROPS_FOR_STYLES = ["weight"];
function splitPrimitiveProps(props) {
  const { className, children, colorMode, variant, ...rest } = props;
  const [styleProps, elementProps] = splitCssProps(rest);
  const domProps = { ...elementProps };
  const patternStyle = {};
  for (const key of BOX_PATTERN_PROPS_FOR_STYLES) {
    if (key in domProps) {
      patternStyle[key] = domProps[key];
      delete domProps[key];
    }
  }
  return {
    className,
    children,
    colorMode,
    variant,
    styleProps: { ...styleProps, ...patternStyle },
    elementProps: domProps
  };
}

// ../reference-core/src/system/primitives/utils.ts
function joinClassName(...parts) {
  const className = parts.filter(Boolean).join(" ").trim();
  return className || void 0;
}

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
var PRIMITIVE_JSX_NAMES = TAGS.map(toJsxName);

// ../reference-core/src/system/primitives/index.tsx
import { jsx } from "react/jsx-runtime";
var A = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-a";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "a",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
A.displayName = "A";
var Abbr = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-abbr";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "abbr",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Abbr.displayName = "Abbr";
var Address = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-address";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "address",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Address.displayName = "Address";
var Area = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-area";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "area",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Area.displayName = "Area";
var Article = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-article";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "article",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Article.displayName = "Article";
var Aside = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-aside";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "aside",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Aside.displayName = "Aside";
var Audio = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-audio";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "audio",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Audio.displayName = "Audio";
var B = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-b";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "b",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
B.displayName = "B";
var Bdi = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-bdi";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "bdi",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Bdi.displayName = "Bdi";
var Bdo = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-bdo";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "bdo",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Bdo.displayName = "Bdo";
var Blockquote = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-blockquote";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "blockquote",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Blockquote.displayName = "Blockquote";
var Br = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-br";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "br",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Br.displayName = "Br";
var Button = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-button";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "button",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Button.displayName = "Button";
var Canvas = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-canvas";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "canvas",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Canvas.displayName = "Canvas";
var Caption = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-caption";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "caption",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Caption.displayName = "Caption";
var Cite = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-cite";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "cite",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Cite.displayName = "Cite";
var Code = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-code";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "code",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Code.displayName = "Code";
var Col = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-col";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "col",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Col.displayName = "Col";
var Colgroup = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-colgroup";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "colgroup",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Colgroup.displayName = "Colgroup";
var Data = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-data";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "data",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Data.displayName = "Data";
var Datalist = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-datalist";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "datalist",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Datalist.displayName = "Datalist";
var Dd = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-dd";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "dd",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Dd.displayName = "Dd";
var Del = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-del";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "del",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Del.displayName = "Del";
var Details = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-details";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "details",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Details.displayName = "Details";
var Dfn = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-dfn";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "dfn",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Dfn.displayName = "Dfn";
var Dialog = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-dialog";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "dialog",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Dialog.displayName = "Dialog";
var Div = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-div";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Div.displayName = "Div";
var Dl = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-dl";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "dl",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Dl.displayName = "Dl";
var Dt = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-dt";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "dt",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Dt.displayName = "Dt";
var Em = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-em";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "em",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Em.displayName = "Em";
var Embed = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-embed";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "embed",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Embed.displayName = "Embed";
var Fieldset = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-fieldset";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "fieldset",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Fieldset.displayName = "Fieldset";
var Figcaption = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-figcaption";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "figcaption",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Figcaption.displayName = "Figcaption";
var Figure = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-figure";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "figure",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Figure.displayName = "Figure";
var Footer = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-footer";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "footer",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Footer.displayName = "Footer";
var Form = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-form";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "form",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Form.displayName = "Form";
var H1 = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-h1";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "h1",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
H1.displayName = "H1";
var H2 = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-h2";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "h2",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
H2.displayName = "H2";
var H3 = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-h3";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "h3",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
H3.displayName = "H3";
var H4 = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-h4";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "h4",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
H4.displayName = "H4";
var H5 = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-h5";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "h5",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
H5.displayName = "H5";
var H6 = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-h6";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "h6",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
H6.displayName = "H6";
var Header = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-header";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "header",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Header.displayName = "Header";
var Hgroup = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-hgroup";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "hgroup",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Hgroup.displayName = "Hgroup";
var Hr = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-hr";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "hr",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Hr.displayName = "Hr";
var I = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-i";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "i",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
I.displayName = "I";
var Iframe = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-iframe";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "iframe",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Iframe.displayName = "Iframe";
var Img = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-img";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "img",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Img.displayName = "Img";
var Input = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-input";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "input",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Input.displayName = "Input";
var Ins = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-ins";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "ins",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Ins.displayName = "Ins";
var Kbd = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-kbd";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "kbd",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Kbd.displayName = "Kbd";
var Label = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-label";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "label",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Label.displayName = "Label";
var Legend = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-legend";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "legend",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Legend.displayName = "Legend";
var Li = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-li";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "li",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Li.displayName = "Li";
var Main = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-main";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "main",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Main.displayName = "Main";
var Map = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-map";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "map",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Map.displayName = "Map";
var Mark = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-mark";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "mark",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Mark.displayName = "Mark";
var Menu = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-menu";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "menu",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Menu.displayName = "Menu";
var Meter = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-meter";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "meter",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Meter.displayName = "Meter";
var Nav = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-nav";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "nav",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Nav.displayName = "Nav";
var Obj = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-object";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "object",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Obj.displayName = "Obj";
var Ol = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-ol";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "ol",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Ol.displayName = "Ol";
var Optgroup = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-optgroup";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "optgroup",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Optgroup.displayName = "Optgroup";
var Option = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-option";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "option",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Option.displayName = "Option";
var Output = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-output";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "output",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Output.displayName = "Output";
var P = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-p";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "p",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
P.displayName = "P";
var Picture = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-picture";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "picture",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Picture.displayName = "Picture";
var Pre = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-pre";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "pre",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Pre.displayName = "Pre";
var Progress = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-progress";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "progress",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Progress.displayName = "Progress";
var Q = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-q";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "q",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Q.displayName = "Q";
var Rp = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-rp";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "rp",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Rp.displayName = "Rp";
var Rt = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-rt";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "rt",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Rt.displayName = "Rt";
var Ruby = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-ruby";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "ruby",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Ruby.displayName = "Ruby";
var S = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-s";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "s",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
S.displayName = "S";
var Samp = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-samp";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "samp",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Samp.displayName = "Samp";
var Search = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-search";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "search",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Search.displayName = "Search";
var Section = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-section";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "section",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Section.displayName = "Section";
var Select = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-select";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "select",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Select.displayName = "Select";
var Small = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-small";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "small",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Small.displayName = "Small";
var Source = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-source";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "source",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Source.displayName = "Source";
var Span = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-span";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "span",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Span.displayName = "Span";
var Strong = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-strong";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "strong",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Strong.displayName = "Strong";
var Sub = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-sub";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "sub",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Sub.displayName = "Sub";
var Summary = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-summary";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "summary",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Summary.displayName = "Summary";
var Sup = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-sup";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "sup",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Sup.displayName = "Sup";
var Svg = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-svg";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "svg",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Svg.displayName = "Svg";
var Table = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-table";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "table",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Table.displayName = "Table";
var Tbody = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-tbody";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "tbody",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Tbody.displayName = "Tbody";
var Td = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-td";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "td",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Td.displayName = "Td";
var Textarea = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-textarea";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "textarea",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Textarea.displayName = "Textarea";
var Tfoot = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-tfoot";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "tfoot",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Tfoot.displayName = "Tfoot";
var Th = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-th";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "th",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Th.displayName = "Th";
var Thead = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-thead";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "thead",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Thead.displayName = "Thead";
var Time = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-time";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "time",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Time.displayName = "Time";
var Tr = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-tr";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "tr",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Tr.displayName = "Tr";
var Track = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-track";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "track",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Track.displayName = "Track";
var U = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-u";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "u",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
U.displayName = "U";
var Ul = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-ul";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "ul",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Ul.displayName = "Ul";
var Var = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-var";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "var",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Var.displayName = "Var";
var Video = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-video";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "video",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Video.displayName = "Video";
var Wbr = React4.forwardRef((allProps, ref) => {
  const typedProps = allProps;
  const { className, children, colorMode, variant, styleProps, elementProps } = splitPrimitiveProps(typedProps);
  const { providesLayerScope, resolvedColorMode, dataLayerAttr, colorModeAttr, variantAttr } = usePrimitiveContext(colorMode, variant);
  const { css: cssProp, ...boxProps } = styleProps;
  const primitiveClass = "ref-wbr";
  const boxClass = box(boxProps);
  const cssClass = cssProp ? customCssFn(cssProp) : void 0;
  const classes = joinClassName(primitiveClass, boxClass, cssClass, className);
  return /* @__PURE__ */ jsx(LayerScopeContext.Provider, { value: providesLayerScope, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: resolvedColorMode, children: /* @__PURE__ */ jsx(
    "wbr",
    {
      ref,
      className: classes,
      ...dataLayerAttr,
      ...colorModeAttr,
      ...variantAttr,
      ...elementProps,
      children
    }
  ) }) });
});
Wbr.displayName = "Wbr";
export {
  A,
  Abbr,
  Address,
  Area,
  Article,
  Aside,
  Audio,
  B,
  Bdi,
  Bdo,
  Blockquote,
  Br,
  Button,
  Canvas,
  Caption,
  Cite,
  Code,
  Col,
  Colgroup,
  ColorModeContext,
  Data,
  Datalist,
  Dd,
  Del,
  Details,
  Dfn,
  Dialog,
  Div,
  Dl,
  DocumentContext,
  Dt,
  Em,
  Embed,
  Fieldset,
  Figcaption,
  Figure,
  Footer,
  Form,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  TAGS as HTML_TAGS,
  Header,
  Hgroup,
  Hr,
  I,
  Iframe,
  Img,
  Input,
  Ins,
  Kbd,
  Label,
  LayerScopeContext,
  Legend,
  Li,
  Main,
  Map,
  Mark,
  Menu,
  Meter,
  Nav,
  Obj,
  Ol,
  Optgroup,
  Option,
  Output,
  P,
  Picture,
  Pre,
  Progress,
  Q,
  Rp,
  Rt,
  Ruby,
  S,
  Samp,
  Search,
  Section,
  Select,
  Small,
  Source,
  Span,
  Strong,
  Sub,
  Summary,
  Sup,
  Svg,
  Table,
  Tbody,
  Td,
  Textarea,
  Tfoot,
  Th,
  Thead,
  Time,
  Tr,
  Track,
  U,
  Ul,
  Var,
  Video,
  Wbr,
  customCssFn as css,
  customCvaFn as recipe,
  useColorMode
};
