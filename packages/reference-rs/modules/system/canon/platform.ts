/**
 * Platform ingest module for Web standards specifications via @webref.
 * Loads living browser specifications for HTML elements and CSS properties.
 * Provides canonical W3C/WHATWG data to validate Reference UI dialects against web standards.
 */
import * as webrefCss from '@webref/css';
import * as webrefElements from '@webref/elements';

export interface PlatformCss {
  properties: Set<string>;
  nativeShorthands: Map<string, string[]>;
}

export function kebabToCamel(name: string): string {
  if (name.startsWith('--')) return name;
  return name
    .replace(/^-([a-z])/, (_, letter) => letter)
    .replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

export async function loadPlatformElements(): Promise<Set<string>> {
  const elementsData = await webrefElements.listAll();
  const elements = new Set<string>();

  for (const group of Object.values(elementsData)) {
    if (group.elements) {
      for (const el of group.elements) {
        elements.add(el.name.toLowerCase());
      }
    }
  }

  return elements;
}

export async function loadPlatformCss(): Promise<PlatformCss> {
  const cssData = await webrefCss.listAll();
  const properties = new Set<string>();
  const nativeShorthands = new Map<string, string[]>();

  for (const prop of cssData.properties) {
    const kebab = prop.name.toLowerCase();
    const camel = kebabToCamel(prop.name);

    properties.add(kebab);
    properties.add(camel);

    if (prop.longhands && prop.longhands.length > 0) {
      const camelLonghands = prop.longhands.map(kebabToCamel);
      nativeShorthands.set(camel, camelLonghands);
    }
  }

  return {
    properties,
    nativeShorthands,
  };
}
