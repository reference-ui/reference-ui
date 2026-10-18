// upstream.ts — the shared sync-and-wire helper for the layers cases (CORE-LAYERS-07, -08,
// -13, -15). It takes a real upstream directory and a consumer world, syncs the upstream
// for real, reads the baseSystem.mjs it published, rewrites the consumer ui.config.ts to
// import and list each upstream under extends or layers, and restores the canonical
// spelling with a resync. It emits the published-system reader, the config rewriter, the
// served sheet reader and the layer block span; each case states its own wiring and claims.
import fs from 'node:fs';
import path from 'node:path';
import { sync } from '../../../../src/sync/index.ts';

const CONFIG_FILE = 'ui.config.ts';
const CONFIG_IMPORT = "import { defineConfig } from '@reference-ui/core'";
const EMPTY_EXTENDS = 'extends: [],';

/** One upstream the consumer imports: the binding name and the path to its baseSystem.mjs. */
export interface UpstreamLink {
  binding: string;
  from: string;
}

/** Which upstream bindings a config lists under each bucket. */
export interface Wiring {
  links: UpstreamLink[];
  extends: string[];
  layers: string[];
}

/** One published stream entry, as baseSystem.mjs carries it. Absent fields are empty. */
export interface PublishedStream {
  name: string;
  package?: string;
  preamble?: string;
  root?: string;
  reset?: string;
  global?: string;
  tokensPortable?: string;
  recipes?: string;
  utilities?: string;
}

/** The published base system: `export const baseSystem = {...}` parsed from its first brace. */
export interface PublishedBaseSystem {
  name: string;
  fragment: string;
  jsxElements: string[];
  streams?: PublishedStream[];
}

/** A `{ from, to }` offset span of one layer block inside the served sheet. */
export interface BlockSpan {
  from: number;
  to: number;
}

/** The consumer's ui.config.ts path inside its world. */
export function configPathOf(worldDir: string): string {
  return path.join(worldDir, CONFIG_FILE);
}

/** The served stylesheet of a synced world. */
export function readSheet(worldDir: string): string {
  return fs.readFileSync(path.join(worldDir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
}

/** The published base system an upstream wrote on its last sync. */
export function readPublished(upDir: string): PublishedBaseSystem {
  const file = path.join(upDir, '.reference-ui', 'system', 'baseSystem.mjs');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw.slice(raw.indexOf('{'))) as PublishedBaseSystem;
}

/** Syncs one upstream for real and returns the base system it published. */
export async function syncUpstream(upDir: string): Promise<PublishedBaseSystem> {
  await sync(upDir);
  return readPublished(upDir);
}

// Replaces one anchor; a count other than one means the canonical config changed shape.
function swapOnce(text: string, anchor: string, replacement: string): string {
  if (text.split(anchor).length !== 2) {
    throw new Error(`canonical ui.config must hold ${JSON.stringify(anchor)} exactly once`);
  }
  return text.replace(anchor, replacement);
}

/** The canonical config with each link imported and each binding listed in its bucket. */
export function wireConfig(canonical: string, wiring: Wiring): string {
  const imports = wiring.links.map(
    (link) => `import { baseSystem as ${link.binding} } from '${link.from}'`,
  );
  const withImports = swapOnce(canonical, CONFIG_IMPORT, [CONFIG_IMPORT, ...imports].join('\n'));
  const lines = [`extends: [${wiring.extends.join(', ')}],`];
  if (wiring.layers.length > 0) lines.push(`layers: [${wiring.layers.join(', ')}],`);
  return swapOnce(withImports, EMPTY_EXTENDS, lines.join('\n  '));
}

/** Writes one config spelling into the world without resyncing it. */
export function writeConfig(worldDir: string, text: string): void {
  fs.writeFileSync(configPathOf(worldDir), text, 'utf8');
}

/** Puts the canonical config back and resyncs, so the tree is canonical whatever a case did. */
export async function restoreWorld(worldDir: string, canonical: string): Promise<void> {
  writeConfig(worldDir, canonical);
  await sync(worldDir);
}

/**
 * The span of one layer block: from its `@layer <name> {` opener to the next block's
 * opener (`next`), or to the end of the sheet when no next layer is named.
 */
export function blockSpan(styles: string, name: string, next?: string): BlockSpan {
  const from = styles.indexOf(`@layer ${name} {`);
  const to = next === undefined ? styles.length : styles.indexOf(`@layer ${next} {`);
  return { from, to };
}
