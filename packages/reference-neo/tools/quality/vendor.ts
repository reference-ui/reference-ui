/**
 * The vendor-freshness tier of the Neo quality gate. It shells out to the primitives
 * vendor tool with --check and maps drift lines onto file violations, so a stale shelf
 * fails the gate before the slower tiers run. It takes nothing and returns violations.
 */
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Violation } from './prose.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const NEO_DIR: string = path.dirname(path.dirname(HERE));
const VENDOR_TOOL: string = path.join(NEO_DIR, 'tools', 'vendor-rust-primitives.mjs');
const VENDOR_DRIFT = /^\s*(missing|stale|extra):\s*(.+)$/;

// Runs the vendor --check; drift lines map onto shelf violations, and an unparseable
// failure maps onto the tool itself so crashes name their cause instead of vanishing.
export async function vendorTier(): Promise<Violation[]> {
  const out = await new Promise<{ code: number | string; text: string }>((resolve) => {
    execFile(
      process.execPath,
      [VENDOR_TOOL, '--check'],
      { cwd: NEO_DIR, maxBuffer: 32 * 1024 * 1024 },
      (err, stdout, stderr) => {
        resolve({ code: err?.code ?? 0, text: `${String(stdout ?? '')}\n${String(stderr ?? '')}` });
      }
    );
  });
  if (out.code === 0) return [];
  const violations: Violation[] = [];
  for (const line of out.text.split('\n')) {
    const hit = line.match(VENDOR_DRIFT);
    if (!hit) continue;
    const rel = hit[2].trim();
    violations.push({
      file: path.join(NEO_DIR, rel),
      line: 1,
      ruleId: 'neo/vendor-fresh',
      severity: 2,
      message: `neo/vendor-fresh: ${hit[1]} vendored file (${rel}); re-run the primitives vendor tool.`,
    });
  }
  if (!violations.length) {
    const why = out.text.split('\n').map((l) => l.trim()).find(Boolean) ?? 'vendor tool failed';
    violations.push({
      file: VENDOR_TOOL,
      line: 1,
      ruleId: 'neo/vendor-fresh',
      severity: 2,
      message: `neo/vendor-fresh: ${why}`,
    });
  }
  return violations;
}
