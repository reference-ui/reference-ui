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
  emitCssRs,
  emitDialectRs,
  emitHtmlRs,
  emitLibRs,
} from './emitters';
import { emitTestsRs } from './emitters-tests';
import { loadPlatformCss, loadPlatformElements, type PlatformCss } from './platform';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const canonSrcDir = path.resolve(__dirname, '../src');

function validateElementsJoin(dialect: DialectData, platformElements: Set<string>): void {
  const invalidTags = dialect.elements.filter(
    (el) => !platformElements.has(el.html.toLowerCase())
  );
  if (invalidTags.length > 0) {
    console.error('[canon] FAIL: Dialect HTML tags not found in web standards (@webref):', invalidTags);
    process.exit(1);
  }
}

function validatePropertiesJoin(dialect: DialectData, platformCss: PlatformCss): void {
  const unverifiedProps = dialect.canonicalProperties.filter((p) => {
    const inWebref = platformCss.properties.has(p.name) || platformCss.properties.has(p.css);
    const inAllowlist = dialect.dialectCssAllowlist.has(p.css) || dialect.dialectCssAllowlist.has(p.name);
    return !inWebref && !inAllowlist;
  });
  if (unverifiedProps.length > 0) {
    console.error('[canon] FAIL: Canonical properties not in webref or dialect allowlist:', unverifiedProps);
    process.exit(1);
  }
}

function validateShorthandsJoin(dialect: DialectData, platformCss: PlatformCss): void {
  const specShorthands = ['padding', 'margin', 'border', 'inset', 'outline'];
  for (const sh of specShorthands) {
    const prop = dialect.canonicalProperties.find((p) => p.name === sh);
    const webrefLonghands = platformCss.nativeShorthands.get(sh);
    if (!prop || !webrefLonghands) {
      console.error(`[canon] FAIL: Missing native shorthand longhands for '${sh}'`);
      process.exit(1);
    }
    const dL = prop.longhands.slice().sort();
    const wL = webrefLonghands.slice().sort();
    if (JSON.stringify(dL) !== JSON.stringify(wL)) {
      console.error(`[canon] FAIL: Mismatched native shorthand longhands for '${sh}':`, { dialect: dL, webref: wL });
      process.exit(1);
    }
  }
}

function validateJoin(
  dialect: DialectData,
  platformElements: Set<string>,
  platformCss: PlatformCss
): void {
  validateElementsJoin(dialect, platformElements);
  validatePropertiesJoin(dialect, platformCss);
  validateShorthandsJoin(dialect, platformCss);
}

function emitAllModules(dialect: DialectData, targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'html.rs'), emitHtmlRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'css.rs'), emitCssRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'dialect.rs'), emitDialectRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'conditions.rs'), emitConditionsRs(dialect), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'lib.rs'), emitLibRs(), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'tests.rs'), emitTestsRs(), 'utf-8');
}

async function main(): Promise<void> {
  console.log('[canon] Ingesting web standards and Reference UI dialect...');
  const platformElements = await loadPlatformElements();
  const platformCss = await loadPlatformCss();
  const dialect = loadDialect();

  console.log('[canon] Validating platform vs dialect join...');
  validateJoin(dialect, platformElements, platformCss);
  console.log('[canon] Join validation passed with 100% compliance.');

  console.log('[canon] Emitting Rust canon modules...');
  emitAllModules(dialect, canonSrcDir);
  console.log('[canon] Successfully generated modules/canon/src/*.rs');
}

main().catch((err) => {
  console.error('[canon] Generation failed:', err);
  process.exit(1);
});
