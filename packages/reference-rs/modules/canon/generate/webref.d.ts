/**
 * Ambient types for `@webref/css` and `@webref/elements`.
 * Those packages ship JSON dumps without `.d.ts`; this file types the `listAll()` ingest
 * surface that canon actually calls. Keep the shapes aligned with css.json / elements JSON,
 * not a full webref model.
 */

declare module '@webref/css' {
  export interface CssProperty {
    name: string;
    syntax?: string;
    longhands?: string[];
  }

  export interface CssCatalog {
    properties: CssProperty[];
  }

  export function listAll(options?: { folder?: string }): Promise<CssCatalog>;
}

declare module '@webref/elements' {
  export interface WebrefElement {
    name: string;
    obsolete?: boolean;
  }

  export interface ElementsGroup {
    elements?: WebrefElement[];
  }

  export function listAll(options?: {
    folder?: string;
  }): Promise<Record<string, ElementsGroup>>;
}
