/**
 * Dialect ingest module for Reference UI style contracts.
 * Ingests authoritative, self-isolated dictionaries of curated HTML tags, PascalCase primitives,
 * StyleProps aliases, class prefixes, rhythm properties, and responsive conditions.
 * Validates dialect definitions against platform standards without external dependencies.
 */

import {
  CANONICAL_UTILITY_STRING,
  CONDITION_KEYS,
  CUSTOM_PREFIXES,
  DIALECT_CSS_ALLOWLIST,
  KNOWN_ALIASES,
  NATIVE_SHORTHANDS,
  ORDERED_BREAKPOINTS,
  PRIMITIVE_TAGS,
  REFERENCE_ONLY_PROPS,
} from './dictionary';

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
  canonicalProperties: DialectProperty[];
  aliases: DialectAlias[];
  referenceProps: string[];
  conditions: string[];
  breakpoints: string[];
  dialectCssAllowlist: Set<string>;
}

function toJsxName(tag: string): string {
  if (tag === 'object') return 'Obj';
  if (tag === 'var') return 'Var';
  if (tag.length <= 1) return tag.toUpperCase();
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

function camelToKebab(str: string): string {
  if (str.startsWith('--')) return str;
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function buildElements(): DialectElement[] {
  const elements = PRIMITIVE_TAGS.map((tag) => ({
    html: tag,
    jsx: toJsxName(tag),
  }));
  return elements.sort((a, b) => a.html.localeCompare(b.html));
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

function buildPropertiesAndAliases(): {
  canonicalProperties: DialectProperty[];
  aliases: DialectAlias[];
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

  const canonicalProperties: DialectProperty[] = [];
  for (const [name, classPrefix] of canonicalPropsMap.entries()) {
    canonicalProperties.push({
      name,
      css: camelToKebab(name),
      classPrefix,
      longhands: NATIVE_SHORTHANDS[name] ?? [],
    });
  }
  canonicalProperties.sort((a, b) => a.name.localeCompare(b.name));

  const aliases: DialectAlias[] = [];
  for (const [alias, canonical] of aliasMap.entries()) {
    aliases.push({ alias, canonical });
  }
  aliases.sort((a, b) => a.alias.localeCompare(b.alias));

  return { canonicalProperties, aliases };
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
    conditions: Array.from(conditionSet).sort(),
    breakpoints: [...ORDERED_BREAKPOINTS],
  };
}

export function loadDialect(): DialectData {
  const elements = buildElements();
  const { canonicalProperties, aliases } = buildPropertiesAndAliases();
  const { conditions, breakpoints } = buildConditions();

  return {
    elements,
    canonicalProperties,
    aliases,
    referenceProps: [...REFERENCE_ONLY_PROPS].sort(),
    conditions,
    breakpoints,
    dialectCssAllowlist: DIALECT_CSS_ALLOWLIST,
  };
}
