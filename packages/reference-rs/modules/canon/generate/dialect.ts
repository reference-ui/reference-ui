/**
 * Dialect ingest module for Reference UI style contracts.
 * Ingests authoritative overlay dictionaries of curated JSX primitives,
 * StyleProps aliases, class prefixes, macros, and responsive conditions.
 * Joins dialect overlay onto living @webref platform tables.
 */

import {
  CANONICAL_UTILITY_STRING,
  CONDITION_KEYS,
  CUSTOM_PREFIXES,
  DIALECT_COLOR_ALLOWLIST,
  DIALECT_CSS_ALLOWLIST,
  KNOWN_ALIASES,
  ORDERED_BREAKPOINTS,
  PRIMITIVE_TAGS,
  REFERENCE_ONLY_PROPS,
} from './dictionary';
import { camelToKebab, kebabToCamel, type PlatformCss } from './platform';

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
  breakpoints: string[];
  colorProperties: string[];
  dialectColorAllowlist: Set<string>;
  dialectCssAllowlist: Set<string>;
  dialectShortPrefixes: Map<string, string>;
  dialectAliases: Map<string, string>;
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

function parseCanonicalUtilityString(
  canonicalPropsMap: Map<string, string>,
  aliasMap: Map<string, string>
): void {
  const utilities = CANONICAL_UTILITY_STRING.split(',');
  for (const utility of utilities) {
    const [prop, meta] = utility.split(':');
    if (!prop || !meta) continue;
    const [className, ...shorthandList] = meta.split('/');
    canonicalPropsMap.set(prop, className);
    for (const shorthand of shorthandList) {
      aliasMap.set(shorthand === '1' ? className : shorthand, prop);
    }
  }
}

function buildPropertiesAndAliases(platformCss: PlatformCss): {
  canonicalProperties: DialectProperty[];
  aliases: DialectAlias[];
  dialectShortPrefixes: Map<string, string>;
  dialectAliases: Map<string, string>;
} {
  const canonicalPropsMap = new Map<string, string>();
  const aliasMap = new Map<string, string>();

  parseCanonicalUtilityString(canonicalPropsMap, aliasMap);

  for (const [prop, prefix] of Object.entries(CUSTOM_PREFIXES)) {
    canonicalPropsMap.set(prop, prefix);
  }
  for (const [alias, canonical] of Object.entries(KNOWN_ALIASES)) {
    aliasMap.set(alias, canonical);
  }

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

  // 2. Add dialect compound extensions that are not CSS (DIALECT_CSS_ALLOWLIST)
  for (const dialectProp of DIALECT_CSS_ALLOWLIST) {
    const camel = kebabToCamel(dialectProp);
    if (!propMap.has(camel)) {
      const classPrefix = canonicalPropsMap.get(camel) ?? dialectProp;
      propMap.set(camel, {
        name: camel,
        css: dialectProp,
        classPrefix,
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
    dialectShortPrefixes: canonicalPropsMap,
    dialectAliases: aliasMap,
  };
}

function buildColorProperties(platformCss: PlatformCss): string[] {
  const colorSet = new Set<string>();

  // Standards-backed color-syntax properties
  for (const prop of platformCss.colorProperties) {
    // Only take camelCase property names into COLOR_PROPERTIES
    if (!prop.includes('-') && !prop.startsWith('--')) {
      colorSet.add(prop);
    }
  }

  // Union dialect color extensions
  for (const color of DIALECT_COLOR_ALLOWLIST) {
    colorSet.add(kebabToCamel(color));
  }

  return Array.from(colorSet).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildConditions(): { conditions: string[]; breakpoints: string[] } {
  const conditionSet = new Set<string>();
  for (const bp of ORDERED_BREAKPOINTS) {
    conditionSet.add(bp);
  }
  for (const cond of CONDITION_KEYS) {
    conditionSet.add(`_${cond}`);
  }
  return {
    conditions: Array.from(conditionSet).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    breakpoints: [...ORDERED_BREAKPOINTS],
  };
}

export function loadDialect(platformCss: PlatformCss): DialectData {
  const elements = buildElements();
  const primitiveJsx = Array.from(new Set(elements.map((e) => e.jsx))).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  const { canonicalProperties, aliases, dialectShortPrefixes, dialectAliases } =
    buildPropertiesAndAliases(platformCss);
  const colorProperties = buildColorProperties(platformCss);
  const { conditions, breakpoints } = buildConditions();

  return {
    elements,
    primitiveJsx,
    canonicalProperties,
    aliases,
    referenceProps: [...REFERENCE_ONLY_PROPS].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    conditions,
    breakpoints,
    colorProperties,
    dialectColorAllowlist: DIALECT_COLOR_ALLOWLIST,
    dialectCssAllowlist: DIALECT_CSS_ALLOWLIST,
    dialectShortPrefixes,
    dialectAliases,
  };
}
