// build-index.mjs — rebuild perf-index.json from wave filings + LOG.md.
// Usage: node build-index.mjs  (run from anywhere; resolves repo root via git)
// Output: ../perf-index.json (committed — the searchable record).
// Zero dependencies. Re-run after every wave closeout / new filing batch.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const WAVES = path.join(ROOT, 'docs/perf/waves');
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'perf-index.json');
// LOG sources: live log + every wave archive (closeout clears the live log,
// so archives are the durable carrier — never drop them from this list).
function logSources() {
  const srcs = [path.join(ROOT, 'LOG.md')];
  for (const wave of fs.readdirSync(WAVES).filter((d) => /^wave-\d+$/.test(d))) {
    for (const f of fs.readdirSync(path.join(WAVES, wave))) {
      if (/^log-archive-.*\.md$/.test(f)) srcs.push(path.join(WAVES, wave, f));
    }
  }
  return srcs.filter((s) => fs.existsSync(s));
}

// Landing commits for integrations (static map — extend per wave).
const LANDINGS = {
  'INT-W2-BANK': '810b8b5b4', 'INT-W2-SET2': '0a5731681', 'INT-W2-SET3': '3dd32a659',
  'INT-W2-CLONEPLASMA': 'ddce131e7', 'INT-W2-SET4': null, 'INT-W2-SET4B': 'e360915f7',
  'INT-W2-SET5': '6c3909506',
  'INT-W4-SCANT1': '1e4e3a0b5',
  'INT-W4-INTMCP': '11e821a1a',
};
// Captain overrules (filed verdict superseded — extend when it happens).
const OVERRULED = {
  'INT-W2-SET4': 'INT-W2-SET4B — captain HELD recipepath (replicated contra), subset landed e360915f',
  'PERF-W2-CASCADE': 'crew CUT overridden — LANDED in set-1/810b8b5b4 (reserve precedent: sub-bar proven-identical)',
  'PERF-W2-AUTHCSS': 'INT-W2-CLONEPLASMA — crew BANK yielded, all 6 hunks subsumed by landed cloneplasma (race rule, count-probed)',
  'PERF-W2-RECIPEPATH': 'PERF-W3-RECIPEPROOF — HELD→CUT (allocator lottery, three-tip sign flips vs ~1–3 ms mechanism ceiling)',
  'PERF-W2-SCALARJSON': 'PERF-W2-SCALARREPROOF — superseded, re-proof landed set-4/e360915f7 (original −14.59 carried crew noise disclaimer; patch retained as record)',
};
const LANDED_FILES = {
// File lists of landed diets (patches deleted after landing — this map is the record).
  'PERF-W2-DIAG': ["packages/reference-rs/modules/atomic/src/diagnostics/channels/mod.rs"],
  'PERF-W2-CANON2': ["packages/reference-rs/modules/canon/src/css/values/classify.rs","packages/reference-rs/modules/canon/src/css/values/functions.rs","packages/reference-rs/modules/canon/src/css/values/mod.rs","packages/reference-rs/modules/canon/src/css/values/named_colors.rs"],
  'PERF-W2-CASCADE': ["packages/reference-rs/modules/atomic/src/stylesheet/cascade/mod.rs"],
  'PERF-W2-PARSE': ["packages/reference-rs/modules/atomic/src/extract/identity.rs","packages/reference-rs/modules/atomic/src/extract/identity_map.rs","packages/reference-rs/modules/atomic/src/extract/identity_tests.rs","packages/reference-rs/modules/atomic/src/hosts/mod.rs","packages/reference-rs/modules/atomic/src/lib.rs","packages/reference-rs/modules/styletrace/src/analysis/analyzer.rs","packages/reference-rs/modules/styletrace/src/analysis/mod.rs","packages/reference-rs/modules/styletrace/src/analysis/parser/mod.rs","packages/reference-rs/modules/styletrace/src/analysis/surface.rs","packages/reference-rs/modules/styletrace/src/lib.rs","packages/reference-rs/modules/styletrace/src/tests/owned_props.rs","packages/reference-rs/modules/styletrace/src/tests/trace_gate.rs"],
  'PERF-W2-KEYS2': ["packages/reference-rs/modules/atomic/src/diagnostics/facts.rs","packages/reference-rs/modules/atomic/src/runtime/serializer.rs"],
  'PERF-W2-HASHERS': ["packages/reference-rs/Cargo.lock","packages/reference-rs/modules/atomic/src/assembly.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/block.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/conditions.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/const_values.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/css.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/imports.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/jsx.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/jsx_attrs.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/mod.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/object.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/structured.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/support.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/values.rs","packages/reference-rs/modules/atomic/src/diagnostics/proof/render.rs","packages/reference-rs/modules/atomic/src/extract/bindings.rs","packages/reference-rs/modules/atomic/src/extract/harvest/literals.rs","packages/reference-rs/modules/atomic/src/extract/harvest/mint/mod.rs","packages/reference-rs/modules/atomic/src/extract/identity.rs","packages/reference-rs/modules/atomic/src/extract/mod.rs","packages/reference-rs/modules/atomic/src/extract/recipes/selection.rs","packages/reference-rs/modules/atomic/src/extract/resolver/differential.rs","packages/reference-rs/modules/atomic/src/extract/resolver/mod.rs","packages/reference-rs/modules/atomic/src/extract/resolver/source.rs","packages/reference-rs/modules/atomic/src/extract/resolver/staging.rs","packages/reference-rs/modules/atomic/src/extract/scope/fill.rs","packages/reference-rs/modules/atomic/src/extract/scope/lookup.rs","packages/reference-rs/modules/atomic/src/extract/scope/value.rs","packages/reference-rs/modules/atomic/src/hosts/mod.rs","packages/reference-rs/modules/atomic/src/lib.rs","packages/reference-rs/modules/atomic/src/recipes/mod.rs","packages/reference-rs/modules/atomic/src/recipes/table.rs","packages/reference-rs/modules/atomic/src/runtime/builder.rs","packages/reference-rs/modules/atomic/src/sources.rs","packages/reference-rs/modules/atomic/src/stylesheet/emitter/mod.rs","packages/reference-rs/modules/base-system/src/breakpoints.rs","packages/reference-rs/modules/module-graph/Cargo.toml","packages/reference-rs/modules/module-graph/src/graph.rs","packages/reference-rs/modules/module-graph/src/ladder/memo.rs","packages/reference-rs/modules/module-graph/src/walk/mod.rs","packages/reference-rs/modules/module-graph/src/walk/star.rs","packages/reference-rs/modules/styletrace/Cargo.toml","packages/reference-rs/modules/styletrace/src/analysis/analyzer.rs","packages/reference-rs/modules/styletrace/src/analysis/model.rs","packages/reference-rs/modules/styletrace/src/analysis/module_resolution.rs","packages/reference-rs/modules/styletrace/src/analysis/parser/component.rs","packages/reference-rs/modules/styletrace/src/analysis/parser/context.rs","packages/reference-rs/modules/styletrace/src/analysis/parser/mod.rs","packages/reference-rs/modules/styletrace/src/analysis/parser/pipeline/mod.rs","packages/reference-rs/modules/styletrace/src/analysis/parser/pipeline/util.rs","packages/reference-rs/modules/styletrace/src/analysis/surface.rs","packages/reference-rs/modules/styletrace/src/analysis/walk/jsx.rs","packages/reference-rs/modules/styletrace/src/analysis/walk/mod.rs","packages/reference-rs/modules/styletrace/src/resolver/model.rs","packages/reference-rs/modules/styletrace/src/resolver/parser.rs","packages/reference-rs/modules/styletrace/src/resolver/tracer/context.rs","packages/reference-rs/modules/styletrace/src/resolver/tracer/mod.rs","packages/reference-rs/modules/styletrace/src/resolver/tracer/resolve.rs","packages/reference-rs/modules/styletrace/src/tests/owned_props.rs","packages/reference-rs/modules/styletrace/src/tests/trace_gate.rs"],
  'PERF-W2-EXTRACT': ["packages/reference-rs/modules/atomic/src/extract/bindings.rs","packages/reference-rs/modules/atomic/src/extract/gating_tests.rs","packages/reference-rs/modules/atomic/src/extract/mod.rs","packages/reference-rs/modules/atomic/src/lib.rs"],
  'PERF-W2-COLLECT': ["packages/reference-rs/modules/atomic/src/includes/glob.rs","packages/reference-rs/modules/atomic/src/includes/mod.rs","packages/reference-rs/modules/atomic/src/sources.rs"],
  'PERF-W2-PROOF': ["packages/reference-rs/modules/atomic/src/diagnostics/proof/mod.rs","packages/reference-rs/modules/atomic/src/diagnostics/proof/render.rs","packages/reference-rs/modules/atomic/src/diagnostics/proof/memo.rs"],
  'PERF-W2-SELPUSH': ["packages/reference-rs/modules/atomic/src/resolve/conditions/pseudoselectors/nesting.rs","packages/reference-rs/modules/atomic/src/stylesheet/name/escape.rs","packages/reference-rs/modules/atomic/src/stylesheet/name/mod.rs"],
  'PERF-W2-SHORTHAND': ["packages/reference-rs/modules/atomic/src/resolve/shorthands/border.rs","packages/reference-rs/modules/atomic/src/resolve/shorthands/dimensional.rs","packages/reference-rs/modules/atomic/src/resolve/shorthands/flex.rs","packages/reference-rs/modules/atomic/src/resolve/shorthands/mod.rs","packages/reference-rs/modules/atomic/src/resolve/shorthands/pair.rs","packages/reference-rs/modules/atomic/src/resolve/shorthands/tests.rs"],
  'PERF-W2-MARSHAL': ["packages/reference-rs/modules/atomic/js/runtime.ts","packages/reference-rs/modules/atomic/native.rs","packages/reference-rs/modules/atomic/src/lib.rs","packages/reference-rs/modules/atomic/src/wire.rs"],
  'PERF-W2-CLONEPLASMA': ["packages/reference-rs/modules/atomic/src/extract/expressions/object/mod.rs","packages/reference-rs/modules/atomic/src/resolve/mod.rs","packages/reference-rs/modules/atomic/src/resolve/normalize.rs","packages/reference-rs/modules/atomic/src/resolve/unit.rs","packages/reference-rs/modules/atomic/src/runtime/builder.rs"],
  'PERF-W2-SYSPREFIX': ["packages/reference-rs/modules/atomic/src/stylesheet/cascade/mod.rs","packages/reference-rs/modules/atomic/src/stylesheet/name/escape.rs","packages/reference-rs/modules/atomic/src/stylesheet/name/mod.rs"],
  'PERF-W2-EXTEND': ["packages/reference-rs/modules/module-graph/src/key.rs","packages/reference-rs/modules/module-graph/src/ladder/mod.rs"],
  'PERF-W2-REALLOC': ["packages/reference-rs/modules/atomic/src/extract/identity.rs","packages/reference-rs/modules/atomic/src/includes/glob.rs","packages/reference-rs/modules/atomic/src/sources.rs"],
  'PERF-W2-SCALARREPROOF': ["packages/reference-rs/modules/atomic/src/runtime/serializer.rs","packages/reference-rs/modules/atomic/tests/serializer_parity.rs"],
  'PERF-W2-LINEINDEX': ["packages/reference-rs/modules/atomic/src/diagnostics/site.rs"],
  'PERF-W2-ANALYSISB': ["packages/reference-rs/modules/atomic/src/diagnostics/analysis/conditions.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/css.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/imports.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/jsx.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/jsx_attrs.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/mod.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/object.rs","packages/reference-rs/modules/atomic/src/diagnostics/analysis/structured.rs","packages/reference-rs/modules/atomic/src/tests/gates.rs"],
  'PERF-W2-PROGRAMSFX': ["packages/reference-rs/modules/atomic/src/extract/identity.rs","packages/reference-rs/modules/atomic/src/extract/identity_tests.rs","packages/reference-rs/modules/atomic/src/hosts/mod.rs","packages/reference-rs/modules/atomic/src/lib.rs","packages/reference-rs/modules/styletrace/src/analysis/surface.rs","packages/reference-rs/modules/styletrace/src/tests/owned_props.rs","packages/reference-rs/modules/styletrace/src/tests/trace_gate.rs"],
  'PERF-W2-WANTCTX': ["packages/reference-rs/modules/atomic/src/recipes/mod.rs","packages/reference-rs/modules/atomic/src/resolve/mod.rs","packages/reference-rs/modules/atomic/src/resolve/tests.rs","packages/reference-rs/modules/atomic/src/resolve/tokens/interpolate.rs","packages/reference-rs/modules/atomic/src/resolve/tokens/mod.rs","packages/reference-rs/modules/atomic/src/resolve/unit.rs","packages/reference-rs/modules/atomic/src/runtime/values.rs"],
  'PERF-W2-STAGEAUDIT': ["packages/reference-rs/modules/atomic/src/extract/resolver/staging.rs","packages/reference-rs/modules/atomic/src/stream.rs"],
  'PERF-W2-BAGDEFER': ["packages/reference-rs/modules/atomic/src/extract/resolver/mod.rs","packages/reference-rs/modules/atomic/src/extract/resolver/source.rs"],
  'PERF-W2-HARVESTPHASE': ["packages/reference-rs/modules/atomic/src/extract/harvest/mint/mod.rs"],
  'PERF-W3-RAWINDEX': ["packages/reference-mcp/src/pipeline/icons-search-index.ts","packages/reference-mcp/tsup.config.ts"],
};
// Crew verdict -> final disposition: these diets are IN THE TREE even when the
// crew verdict says CUT (captain override, reserve precedent).
const LANDED_IN = {
  'PERF-W2-DIAG': 'set-1/810b8b5b4', 'PERF-W2-CANON2': 'set-1/810b8b5b4',
  'PERF-W2-CASCADE': 'set-1/810b8b5b4', 'PERF-W2-PARSE': 'set-1/810b8b5b4',
  'PERF-W2-KEYS2': 'set-1/810b8b5b4', 'PERF-W2-HASHERS': 'set-2/0a5731681',
  'PERF-W2-EXTRACT': 'set-2/0a5731681', 'PERF-W2-COLLECT': 'set-3/3dd32a659',
  'PERF-W2-PROOF': 'set-3/3dd32a659', 'PERF-W2-SELPUSH': 'set-3/3dd32a659',
  'PERF-W2-SHORTHAND': 'set-3/3dd32a659', 'PERF-W2-MARSHAL': 'set-3/3dd32a659',
  'PERF-W2-CLONEPLASMA': 'solo/ddce131e7', 'PERF-W2-SYSPREFIX': 'set-4/e360915f7',
  'PERF-W2-EXTEND': 'set-4/e360915f7', 'PERF-W2-REALLOC': 'set-4/e360915f7',
  'PERF-W2-SCALARREPROOF': 'set-4/e360915f7', 'PERF-W2-LINEINDEX': 'set-4/e360915f7',
  'PERF-W2-ANALYSISB': 'set-4/e360915f7', 'PERF-W2-PROGRAMSFX': 'set-5/6c3909506',
  'PERF-W2-WANTCTX': 'set-5/6c3909506', 'PERF-W2-STAGEAUDIT': 'set-5/6c3909506',
  'PERF-W2-BAGDEFER': 'set-5/6c3909506', 'PERF-W2-HARVESTPHASE': 'set-5/6c3909506',
  'PERF-W3-RAWINDEX': 'solo/b3181fa93',
};

const slugWords = (s) => s.replace(/-/g, ' ');
const normMinus = (s) => s.replace(/[−–]/g, '-');

const VWORDS = '(PER-PHASE-BANK|REPROFILE-COMPLETE|LAND-SUBSET\\d*|LAND|BANK|CUT|HOLD|YIELD|KILL)';

function verdictOf(lines, isIntegrate) {
  const text = lines.join('\n');
  // Prefer the ## Verdict section wherever it sits (long reports bury it).
  const sec = text.split(/## Verdict[^\n]*\n/i)[1]?.split(/\n## /)[0] || '';
  const head = lines.slice(0, 80).join('\n');
  const m = sec.match(new RegExp(`\\*\\*\\s*(?:swarm-\\w+\\s+)?${VWORDS}\\b`, 'i'))
    || head.match(new RegExp(`\\*\\*\\s*(?:swarm-\\w+\\s+)?${VWORDS}\\b`, 'i'))
    || sec.match(new RegExp(`\`${VWORDS}\\b`, ''))
    || head.match(new RegExp(`\`${VWORDS}\\b`, ''))
    || sec.match(new RegExp(`verdict[:\\s]+\\*?${VWORDS}\\b`, 'i'))
    || head.match(new RegExp(`verdict[:\\s]+\\*?${VWORDS}\\b`, 'i'))
    || (/no candidate was built/i.test(sec) ? { 1: 'CUT' } : null)
    || (/CUT (before the timed bench|trigger)/i.test(text) ? { 1: 'CUT' } : null);
  if (!m) {
    const dv = text.match(/^DIET-VERDICT:\s*(LAND|BANK|CUT)\b/im);
    if (dv) return dv[1];
    if (/RECON-VERDICT:/.test(text)) return 'REPROFILE';
    if (/REFLAME-VERDICT:/.test(text)) return 'REPROFILE';
    return isIntegrate ? 'LAND' : 'UNKNOWN';
  }
  const v = (m[1] || m[0]).toUpperCase().replace(/^\*+/, '');
  if (v.startsWith('LAND-SUBSET')) return 'LAND-SUBSET';
  if (v === 'REPROFILE-COMPLETE') return 'REPROFILE';
  return v;
}

function effectOf(lines) {
  const text = normMinus(lines.slice(0, 100).join('\n'));
  const out = {};
  const ms = text.match(/([+-]?\d+\.\d+)\s*ms/);
  if (ms) out.ms = parseFloat(ms[1]);
  const pct = text.match(/([+-]?\d+\.\d+)\s*%/);
  if (pct) out.pct = parseFloat(pct[1]);
  const pr = text.match(/(\d+)\s*\/\s*(\d+)\s*(?:pairs|favor)\b/i) || text.match(/\b(\d)\s*\/\s*8\b/);
  if (pr) out.pairs = `${pr[1]}/${pr[2] || '8'}`;
  return out;
}

function summaryOf(lines) {
  const one = lines.find((l) => /^one line:/i.test(l.trim()));
  if (one) return one.replace(/^one line:\s*/i, '').trim().slice(0, 400);
  for (const l of lines.slice(1)) {
    const t = l.trim();
    if (!t || t.startsWith('#') || t.startsWith('**')) continue;
    return t.slice(0, 400);
  }
  return '';
}

function patchFiles(patchPath) {
  if (!fs.existsSync(patchPath)) return [];
  const files = [];
  for (const l of fs.readFileSync(patchPath, 'utf8').split('\n')) {
    const m = l.match(/^\+\+\+ b\/(.+)$/);
    if (m && m[1] !== '/dev/null') files.push(m[1]);
  }
  return [...new Set(files)];
}

function readSources() {
  return logSources().map((s) => fs.readFileSync(s, 'utf8'));
}

// ---- swarm entries: "- swarm-<slug> ..." blocks (live log + archives) ----
function logEntries() {
  const map = {};
  for (const text of readSources()) {
    const lines = text.split('\n');
    let cur = null, buf = [];
    const flush = () => {
      if (cur) {
        const t = buf.join('\n').trim();
        (map[cur] = map[cur] || []).push(t);
      }
    };
    for (const l of lines) {
      const m = l.match(/^- (swarm-[a-z0-9]+)\b/);
      if (m) { flush(); cur = m[1].replace(/^swarm-/, ''); buf = [l]; }
      else if (cur) {
        if (/^- (Tick|[A-Z])/.test(l) && !l.startsWith('- swarm-')) { flush(); cur = null; buf = []; }
        else buf.push(l);
      }
    }
    flush();
  }
  // join multiples (a topic may appear twice) with separator
  for (const k of Object.keys(map)) map[k] = map[k].join('\n---\n').slice(0, 3000);
  return map;
}

function deadEnds() {
  const out = [];
  for (const text of readSources()) {
    const sec = (text.split(/## Dead ends[^\n]*\n/)[1] || '').split(/\n## /)[0];
    for (const l of sec.split('\n').map((x) => x.trim()).filter((x) => x.startsWith('- '))) {
      const d = l.slice(2);
      if (d && !out.includes(d)) out.push(d);
    }
  }
  return out;
}

const entries = [];
const logs = logEntries();

for (const wave of fs.readdirSync(WAVES).filter((d) => /^wave-\d+$/.test(d)).sort()) {
  const dir = path.join(WAVES, wave);
  const wtag = wave.replace('wave-', 'W').toUpperCase();
  for (const f of fs.readdirSync(dir).sort()) {
    const fp = path.join(dir, f);
    if (!fs.statSync(fp).isFile() || !f.endsWith('.md')) continue;
    const rel = path.relative(ROOT, fp);
    const lines = fs.readFileSync(fp, 'utf8').split('\n');
    const head = lines.slice(0, 80);
    if (f.startsWith('report-swarm-')) {
      const slug = f.replace('report-swarm-', '').replace('.md', '');
      const patch = path.join(dir, `${slug}.patch`);
      const verdict = verdictOf(lines, false);
      const id = `PERF-${wtag}-${slug.toUpperCase()}`;
      entries.push({
        id,
        wave, topic: slugWords(slug), kind: verdict === 'REPROFILE' ? 'repro' : (LANDED_IN[id] || fs.existsSync(patch) ? 'diet' : (verdict === 'CUT' ? 'recon' : 'diet')),
        verdict, effect: effectOf(lines),
        overruledBy: OVERRULED[id] || null,
        files: fs.existsSync(patch) ? patchFiles(patch) : (LANDED_FILES[id] || []), report: rel,
        patch: fs.existsSync(patch) ? path.relative(ROOT, patch) : null,
        landedIn: LANDED_IN[id] || null,
        summary: summaryOf(lines), log: logs[slug] || null,
        filler: /filler/i.test(lines.join('\n').slice(0, 6000)),
      });
    } else if (f.startsWith('integrate-') || f === 'INTEGRATE.md') {
      const slug = f === 'INTEGRATE.md' ? 'BANK' : f.replace('integrate-', '').replace('.md', '');
      const id = `INT-${wtag}-${slug.toUpperCase()}`;
      entries.push({
        id, wave, topic: `integrate ${slugWords(slug)}`, kind: 'integration',
        verdict: verdictOf(lines, true), effect: effectOf(lines),
        files: [], report: rel, patch: null, landing: LANDINGS[id] || null,
        overruledBy: OVERRULED[id] || null,
        summary: summaryOf(lines), log: logs[`int${slug}`] || logs[slug] || null,
        filler: false,
      });
    } else if (/^(memo|panda)-/.test(f)) {
      const slug = f.replace('.md', '');
      entries.push({
        id: `MEMO-${slug.toUpperCase().replace(/-/g, '')}`, wave, topic: slugWords(slug),
        kind: 'memo', verdict: 'MEMO', effect: {}, files: [], report: rel,
        patch: null, summary: summaryOf(lines), log: null, filler: false,
      });
    }
  }
}

// Dead ends from LOG.md
for (const d of deadEnds()) {
  const slug = d.slice(0, 40).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  entries.push({
    id: `DEAD-${slug.toUpperCase()}`, wave: 'log', topic: d.slice(0, 80),
    kind: 'dead-end', verdict: 'CUT', effect: {}, files: [], report: 'LOG.md',
    patch: null, summary: d.slice(0, 400), log: null, filler: false,
  });
}

entries.sort((a, b) => a.id.localeCompare(b.id));
const index = { built: new Date().toISOString(), root: 'docs/perf/waves', count: entries.length, entries };
fs.writeFileSync(OUT, JSON.stringify(index, null, 1) + '\n');
const kinds = {};
for (const e of entries) kinds[e.kind] = (kinds[e.kind] || 0) + 1;
console.log(`perf-index: ${entries.length} entries -> ${path.relative(ROOT, OUT)}`);
console.log('kinds:', JSON.stringify(kinds));
