/**
 * Platform ingest module for Web standards specifications via @webref.
 * Loads living browser specifications for HTML/SVG elements and CSS properties.
 * Provides canonical W3C/WHATWG data as the primary platform truth for the compiler.
 */
import * as webrefCss from '@webref/css';
import * as webrefElements from '@webref/elements';

export interface PlatformCssProperty {
  name: string;
  kebab: string;
  longhands: string[];
}

export interface PlatformCss {
  properties: Map<string, PlatformCssProperty>;
  propertyNames: Set<string>;
  nativeShorthands: Map<string, string[]>;
  colorProperties: Set<string>;
}

export function kebabToCamel(name: string): string {
  if (name.startsWith('--')) return name;
  return name
    .replace(/^-([a-z])/, (_, letter) => letter)
    .replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

export function camelToKebab(str: string): string {
  if (str.startsWith('--')) return str;
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const EXCLUDED_HTML_TAGS = new Set<string>([
  'html', 'head', 'body', 'script', 'style', 'link', 'meta',
  'template', 'slot', 'noscript', 'title', 'base',
  'applet', 'blink', 'font', 'marquee', 'frameset', 'frame',
  'dir', 'bgsound', 'isindex', 'nobr', 'listing', 'plaintext',
  'xmp', 'param', 'noembed', 'noframes',
]);

interface ElementsGroup {
  elements?: Array<{ name: string; obsolete?: boolean }>;
}

function collectHtmlElements(
  data: Record<string, ElementsGroup>,
  target: Set<string>
): void {
  const htmlGroup = data.html;
  if (!htmlGroup?.elements) return;
  for (const el of htmlGroup.elements) {
    const name = el.name.toLowerCase();
    if (!EXCLUDED_HTML_TAGS.has(name) && !el.obsolete) {
      target.add(name);
    }
  }
}

function collectSvgElements(
  data: Record<string, ElementsGroup>,
  target: Set<string>
): void {
  const groups = ['SVG2', 'SVG11', 'css-masking-1'];
  for (const group of groups) {
    const g = data[group];
    if (!g?.elements) continue;
    for (const el of g.elements) {
      target.add(el.name.toLowerCase());
    }
  }
}

export async function loadPlatformElements(): Promise<Set<string>> {
  const elementsData = await webrefElements.listAll();
  const elements = new Set<string>();
  collectHtmlElements(elementsData as Record<string, ElementsGroup>, elements);
  collectSvgElements(elementsData as Record<string, ElementsGroup>, elements);
  return elements;
}

export async function loadPlatformCss(): Promise<PlatformCss> {
  const cssData = await webrefCss.listAll();
  const properties = new Map<string, PlatformCssProperty>();
  const propertyNames = new Set<string>();
  const nativeShorthands = new Map<string, string[]>();
  const colorProperties = new Set<string>();

  for (const prop of cssData.properties) {
    const kebab = prop.name.toLowerCase();
    const camel = kebabToCamel(prop.name);

    const camelLonghands = (prop.longhands && prop.longhands.length > 0)
      ? prop.longhands.map(kebabToCamel)
      : [];

    properties.set(camel, {
      name: camel,
      kebab: prop.name,
      longhands: camelLonghands,
    });

    propertyNames.add(kebab);
    propertyNames.add(camel);

    const syntax = prop.syntax || '';
    if (
      syntax.includes('<color>') ||
      syntax.includes('<paint>') ||
      kebab.endsWith('-color') ||
      kebab === 'color'
    ) {
      colorProperties.add(kebab);
      colorProperties.add(camel);
    }

    if (camelLonghands.length > 0) {
      nativeShorthands.set(camel, camelLonghands);
    }
  }

  return {
    properties,
    propertyNames,
    nativeShorthands,
    colorProperties,
  };
}
