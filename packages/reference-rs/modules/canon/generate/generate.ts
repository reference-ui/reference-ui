/**
 * Canon generator for Reference UI compiler modules.
 * Ingests living web standards (@webref) and Reference UI design system dialects.
 * Validates dialect against platform standards fail-closed before emitting Rust code.
 * Emits zero-allocation static Rust modules into modules/canon/src.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadDialect, type DialectData } from './dialect';
import {
  emitConditionsRs,
  emitDialectRs,
  emitHtmlRs,
  emitLibRs,
} from './emitters';
import {
  emitCssColorRs,
  emitCssLonghandsRs,
  emitCssModRs,
  emitCssPropertiesRs,
} from './emitters-css';
import { emitTestsRs } from './emitters-tests';
import { loadPlatformCss, loadPlatformElements } from './platform';
import { validateJoin } from './join';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const canonSrcDir = path.resolve(__dirname, '../src');

function emitAllModules(dialect: DialectData, targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'css'), { recursive: true });

  // Remove old flat css.rs if it exists to avoid module collision with css/
  const oldCssRs = path.join(targetDir, 'css.rs');
  if (fs.existsSync(oldCssRs)) {
    fs.unlinkSync(oldCssRs);
  }

  fs.writeFileSync(path.join(targetDir, 'html.rs'), emitHtmlRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'dialect.rs'), emitDialectRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'conditions.rs'), emitConditionsRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'css/mod.rs'), emitCssModRs(), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'css/longhands.rs'), emitCssLonghandsRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'css/color.rs'), emitCssColorRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'css/properties.rs'), emitCssPropertiesRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'lib.rs'), emitLibRs(), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'tests.rs'), emitTestsRs(), 'utf-8');
}

async function main(): Promise<void> {
  console.log('[canon] Ingesting web standards and Reference UI dialect...');
  const platformElements = await loadPlatformElements();
  const platformCss = await loadPlatformCss();
  const dialect = loadDialect(platformCss);

  console.log('[canon] Validating platform vs dialect inverted join...');
  const errors = validateJoin(dialect, platformElements, platformCss);
  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`[canon] ${err}`);
    }
    process.exit(1);
  }
  console.log('[canon] Inverted join validation passed with 100% compliance.');

  console.log('[canon] Emitting Rust canon modules...');
  emitAllModules(dialect, canonSrcDir);
  console.log('[canon] Successfully generated modules/canon/src/*.rs');
}

main().catch((err) => {
  console.error('[canon] Generation failed:', err);
  process.exit(1);
});
