/**
 * Dialect ingest module for Reference UI style contracts.
 * Loads curated HTML tags, PascalCase primitives, StyleProps aliases, rhythm properties,
 * and responsive condition definitions from Reference Core and Panda presets.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// 1. Curated Reference Primitives
import { TAGS, PRIMITIVE_JSX_NAMES } from '../../reference-core/src/system/primitives/tags';

// 2. Panda Base Utilities
import * as utilMod from '../../../vendor/panda/packages/preset-base/src/utilities/index';
const utilities = (utilMod as any).utilities ?? (utilMod as any).default?.utilities ?? utilMod;

// 3. Reference Core Extensions
import { rhythmUtilities } from '../../reference-core/src/system/panda/config/extensions/rhythm/utilities';
import { borderShorthandUtilities } from '../../reference-core/src/system/panda/config/extensions/shorthands/border';
import { outlineShorthandUtilities } from '../../reference-core/src/system/panda/config/extensions/shorthands/outline';

// 4. Conditions & Breakpoints
import * as condMod from '../../../vendor/panda/packages/preset-base/src/conditions';
const conditions = (condMod as any).conditions ?? (condMod as any).default?.conditions ?? condMod;
import * as bpMod from '../../../vendor/panda/packages/preset-panda/src/breakpoints';
const pandaBreakpoints = (bpMod as any).breakpoints ?? (bpMod as any).default?.breakpoints ?? bpMod;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function camelToKebab(str: string): string {
  if (str.startsWith('--')) return str;
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/^-([a-z])/, (_, l) => l)
    .toLowerCase();
}

export function loadDialect(): DialectData {
  // Elements: 1:1 pair of HTML tag to PascalCase JSX primitive name
  const elements: DialectElement[] = [];
  for (let i = 0; i < TAGS.length; i++) {
    elements.push({
      html: TAGS[i],
      jsx: PRIMITIVE_JSX_NAMES[i],
    });
  }
  elements.sort((a, b) => a.html.localeCompare(b.html));

  // Canonical properties and class prefixes map
  const canonicalPropsMap = new Map<string, string>();
  const aliasMap = new Map<string, string>();

  // Read Panda runtime utilities string from css.js for class prefixes and shorthands
  const cssJsPath = path.resolve(__dirname, '../../reference-core/src/system/styled/css/css.js');
  if (fs.existsSync(cssJsPath)) {
    const cssJsContent = fs.readFileSync(cssJsPath, 'utf-8');
    const match = cssJsContent.match(/const utilities = "([^"]+)"/);
    if (match) {
      const rawUtilities = match[1];
      rawUtilities.split(',').forEach((utility) => {
        const [prop, meta] = utility.split(':');
        if (!prop || !meta) return;
        const [className, ...shorthandList] = meta.split('/');
        canonicalPropsMap.set(prop, className);
        if (shorthandList.length) {
          shorthandList.forEach((shorthand) => {
            aliasMap.set(shorthand === '1' ? className : shorthand, prop);
          });
        }
      });
    }
  }

  // Directional style and outline style class names
  const customPrefixes: Record<string, string> = {
    borderStyle: 'border-style',
    borderTopStyle: 'bd-t-s',
    borderRightStyle: 'bd-r-s',
    borderBottomStyle: 'bd-b-s',
    borderLeftStyle: 'bd-l-s',
    borderInlineStyle: 'bd-x-s',
    borderBlockStyle: 'bd-y-s',
    borderInlineStartStyle: 'bd-s-s',
    borderInlineEndStyle: 'bd-e-s',
    borderBlockStartStyle: 'bd-bs-s',
    borderBlockEndStyle: 'bd-be-s',
    outlineStyle: 'ring-s',
  };
  for (const [prop, prefix] of Object.entries(customPrefixes)) {
    canonicalPropsMap.set(prop, prefix);
  }

  // Reference UI dialect aliases
  const knownAliases: Record<string, string> = {
    pos: 'position',
    rounded: 'borderRadius',
    roundedTop: 'borderTopRadius',
    roundedRight: 'borderRightRadius',
    roundedBottom: 'borderBottomRadius',
    roundedLeft: 'borderLeftRadius',
    shadow: 'boxShadow',
    bgColor: 'backgroundColor',
    bgImage: 'backgroundImage',
    bgGradient: 'backgroundGradient',
    borderX: 'borderInline',
    borderY: 'borderBlock',
    borderT: 'borderTop',
    borderR: 'borderRight',
    borderB: 'borderBottom',
    borderL: 'borderLeft',
  };
  for (const [alias, canonical] of Object.entries(knownAliases)) {
    aliasMap.set(alias, canonical);
  }

  // Add shorthands from Panda utilities and extensions
  const allUtilityConfigs = {
    ...utilities,
    ...rhythmUtilities,
    ...borderShorthandUtilities,
    ...outlineShorthandUtilities,
  };
  for (const [propName, config] of Object.entries(allUtilityConfigs)) {
    if ((config as any).shorthand) {
      const sh = (config as any).shorthand;
      if (Array.isArray(sh)) {
        sh.forEach((s) => aliasMap.set(s, propName));
      } else {
        aliasMap.set(sh, propName);
      }
    }
  }

  // Native spec shorthand longhand mappings (in camelCase)
  const nativeShorthandLonghands: Record<string, string[]> = {
    padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
    margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
    border: ['borderWidth', 'borderStyle', 'borderColor'],
    inset: ['top', 'right', 'bottom', 'left'],
    outline: ['outlineWidth', 'outlineStyle', 'outlineColor'],
    borderTop: ['borderTopWidth', 'borderTopStyle', 'borderTopColor'],
    borderRight: ['borderRightWidth', 'borderRightStyle', 'borderRightColor'],
    borderBottom: ['borderBottomWidth', 'borderBottomStyle', 'borderBottomColor'],
    borderLeft: ['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor'],
    borderInline: ['borderInlineWidth', 'borderInlineStyle', 'borderInlineColor'],
    borderBlock: ['borderBlockWidth', 'borderBlockStyle', 'borderBlockColor'],
  };

  // Convert to sorted canonical properties
  const canonicalProperties: DialectProperty[] = [];
  for (const [name, classPrefix] of canonicalPropsMap.entries()) {
    const css = camelToKebab(name);
    const longhands = nativeShorthandLonghands[name] ?? [];
    canonicalProperties.push({
      name,
      css,
      classPrefix,
      longhands,
    });
  }
  canonicalProperties.sort((a, b) => a.name.localeCompare(b.name));

  // Convert to sorted aliases
  const aliases: DialectAlias[] = [];
  for (const [alias, canonical] of aliasMap.entries()) {
    aliases.push({ alias, canonical });
  }
  aliases.sort((a, b) => a.alias.localeCompare(b.alias));

  // Reference-only props
  const referenceProps = [
    'colorMode',
    'container',
    'font',
    'r',
    'variant',
    'weight',
  ].sort();

  // Conditions & Breakpoints
  const orderedBreakpoints = ['base', ...Object.keys(pandaBreakpoints)];
  const conditionSet = new Set<string>();
  for (const bp of orderedBreakpoints) {
    conditionSet.add(bp);
  }
  for (const cond of Object.keys(conditions)) {
    conditionSet.add(`_${cond}`);
  }
  const sortedConditions = Array.from(conditionSet).sort();

  // Dialect CSS allowlist (properties known to Reference/Panda that extend standard webref)
  const dialectCssAllowlist = new Set<string>([
    'animation-state',
    'backdrop-blur',
    'backdrop-brightness',
    'backdrop-contrast',
    'backdrop-grayscale',
    'backdrop-hue-rotate',
    'backdrop-invert',
    'backdrop-opacity',
    'backdrop-saturate',
    'backdrop-sepia',
    'background-conic',
    'background-gradient',
    'background-linear',
    'background-radial',
    'blur',
    'border-block-end-style',
    'border-block-start-style',
    'border-block-style',
    'border-bottom-style',
    'border-end-radius',
    'border-inline-end-style',
    'border-inline-start-style',
    'border-inline-style',
    'border-left-style',
    'border-right-style',
    'border-spacing-x',
    'border-spacing-y',
    'border-start-radius',
    'border-top-style',
    'box-size',
    'brightness',
    'contrast',
    'debug',
    'divide-color',
    'divide-style',
    'divide-x',
    'divide-y',
    'drop-shadow',
    'focus-ring',
    'focus-ring-color',
    'focus-ring-offset',
    'focus-ring-style',
    'focus-ring-width',
    'focus-visible-ring',
    'font-smoothing',
    'gradient-from',
    'gradient-from-position',
    'gradient-to',
    'gradient-to-position',
    'gradient-via',
    'gradient-via-position',
    'grayscale',
    'hide-below',
    'hide-from',
    'hue-rotate',
    'invert',
    'outline-style',
    'overflow-clip-box',
    'rotate-x',
    'rotate-y',
    'rotate-z',
    'saturate',
    'scale-x',
    'scale-y',
    'scrollbar',
    'scroll-snap-coordinate',
    'scroll-snap-destination',
    'scroll-snap-margin',
    'scroll-snap-margin-bottom',
    'scroll-snap-margin-left',
    'scroll-snap-margin-right',
    'scroll-snap-margin-top',
    'scroll-snap-points-x',
    'scroll-snap-points-y',
    'scroll-snap-strictness',
    'scroll-snap-type-x',
    'scroll-snap-type-y',
    'sepia',
    'space-x',
    'space-y',
    'sr-only',
    'text-gradient',
    'text-shadow-color',
    'text-style',
    'translate-x',
    'translate-y',
    'translate-z',
    'truncate',
    'webkit-text-fill-color',
  ]);

  return {
    elements,
    canonicalProperties,
    aliases,
    referenceProps,
    conditions: sortedConditions,
    breakpoints: orderedBreakpoints,
    dialectCssAllowlist,
  };
}
