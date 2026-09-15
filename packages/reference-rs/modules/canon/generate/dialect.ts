/**
 * Dialect ingest module for Reference UI style engine contracts.
 * Ingests authoritative overlay dictionaries of curated JSX primitives,
 * StyleProps aliases, short class prefixes, macros, extensions, and named conditions.
 * Joins the typed dialect overlay onto living @webref platform tables.
 */

import {
  ALIASES,
  EXTENSIONS,
  NAMED_CONDITIONS,
  PRIMITIVE_TAGS,
  REFERENCE_ONLY_PROPS,
  SHORT_PREFIXES,
  type ExtensionProp,
} from './overlay';
import type { PlatformCss } from './platform';

export interface DialectElement {
  html: string;
  jsx: string;
}

export interface DialectProperty {
  name: string;
  css: string;
  classPrefix: string;
  longhands: string[];
}

export interface DialectAlias {
  alias: string;
  canonical: string;
}

export interface DialectData {
  elements: DialectElement[];
  primitiveJsx: string[];
  canonicalProperties: DialectProperty[];
  aliases: DialectAlias[];
  referenceProps: string[];
  conditions: string[];
  colorProperties: string[];
  extensions: readonly ExtensionProp[];
}

function toJsxName(tag: string): string {
  if (tag === 'object') return 'Obj';
  if (tag === 'var') return 'Var';
  if (tag === 'clipPath') return 'ClipPath';
  if (tag === 'linearGradient') return 'LinearGradient';
  if (tag === 'radialGradient') return 'RadialGradient';
  if (tag === 'foreignObject') return 'ForeignObject';
  if (tag.length <= 1) return tag.toUpperCase();
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

function buildElements(): DialectElement[] {
  const elements = PRIMITIVE_TAGS.map((tag) => ({
    html: tag.toLowerCase(),
    jsx: toJsxName(tag),
  }));
  return elements.sort((a, b) => (a.html < b.html ? -1 : a.html > b.html ? 1 : 0));
}

function buildPropertiesAndAliases(platformCss: PlatformCss): {
  canonicalProperties: DialectProperty[];
  aliases: DialectAlias[];
} {
  const canonicalPropsMap = new Map<string, string>(Object.entries(SHORT_PREFIXES));
  const aliasMap = new Map<string, string>(Object.entries(ALIASES));
  const propMap = new Map<string, DialectProperty>();

  // 1. Emit all living CSS properties from @webref
  for (const platformProp of platformCss.properties.values()) {
    const classPrefix = canonicalPropsMap.get(platformProp.name) ?? platformProp.kebab;
    propMap.set(platformProp.name, {
      name: platformProp.name,
      css: platformProp.kebab,
      classPrefix,
      longhands: platformProp.longhands,
    });
  }

  // 2. Add explicit dialect extensions
  for (const ext of EXTENSIONS) {
    if (!propMap.has(ext.name)) {
      propMap.set(ext.name, {
        name: ext.name,
        css: ext.css,
        classPrefix: ext.classPrefix,
        longhands: [],
      });
    }
  }

  const canonicalProperties = Array.from(propMap.values()).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  );

  const aliases: DialectAlias[] = [];
  for (const [alias, canonical] of aliasMap.entries()) {
    aliases.push({ alias, canonical });
  }
  aliases.sort((a, b) => (a.alias < b.alias ? -1 : a.alias > b.alias ? 1 : 0));

  return {
    canonicalProperties,
    aliases,
  };
}

function buildColorProperties(platformCss: PlatformCss): string[] {
  const colorSet = new Set<string>();

  // Standards-backed color-syntax properties from @webref
  for (const prop of platformCss.colorProperties) {
    if (!prop.includes('-') && !prop.startsWith('--')) {
      colorSet.add(prop);
    }
  }

  // Union dialect color extensions
  for (const ext of EXTENSIONS) {
    if (ext.color) {
      colorSet.add(ext.name);
    }
  }

  return Array.from(colorSet).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function loadDialect(platformCss: PlatformCss): DialectData {
  const elements = buildElements();
  const primitiveJsx = Array.from(new Set(elements.map((e) => e.jsx))).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  const { canonicalProperties, aliases } = buildPropertiesAndAliases(platformCss);
  const colorProperties = buildColorProperties(platformCss);
  const conditions = [...NAMED_CONDITIONS].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return {
    elements,
    primitiveJsx,
    canonicalProperties,
    aliases,
    referenceProps: [...REFERENCE_ONLY_PROPS].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    conditions,
    colorProperties,
    extensions: EXTENSIONS,
  };
}


