// perf.mjs — agent-perf index CLI. Usage:
//   node perf.mjs list [--wave wave-2] [--verdict BANK]
//   node perf.mjs search <query>          (fuzzy over topic/summary/log)
//   node perf.mjs show <PERF-...|INT-...>
//   node perf.mjs stats
//   node perf.mjs rebuild                 (re-runs build-index.mjs)
import { execSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const INDEX = path.join(HERE, '..', 'perf-index.json');
const load = () => JSON.parse(fs.readFileSync(INDEX, 'utf8'));

const eff = (e) => {
  const p = [];
  if (e.effect?.ms != null) p.push(`${e.effect.ms}ms`);
  if (e.effect?.pct != null) p.push(`${e.effect.pct}%`);
  if (e.effect?.pairs) p.push(e.effect.pairs);
  return p.join(' ');
};

// substring match score; -1 = no match. Substring-only by design: looser
// subsequence matching made nonsense queries return confident hits.
function fuzz(q, s) {
  q = q.toLowerCase(); s = s.toLowerCase();
  if (!q) return 0;
  if (!s.includes(q)) return -1;
  return q.length * 3 + (s === q ? 50 : 0);
}

function search(index, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const out = [];
  for (const e of index.entries) {
    let score = 0;
    const fields = [
      [e.topic, 5], [e.id, 4], [e.verdict, 2],
      [e.summary || '', 2], [e.log || '', 1],
    ];
    for (const w of words) {
      let best = -1;
      for (const [text, wt] of fields) {
        const s = fuzz(w, text || '');
        if (s > best) best = s * wt;
      }
      if (best < 0) { score = -1; break; }
      score += best;
    }
    if (score >= 0) out.push([score, e]);
  }
  return out.sort((a, b) => b[0] - a[0]).map(([, e]) => e);
}

const args = process.argv.slice(2);
const cmd = args[0] || 'list';

if (cmd === 'rebuild') {
  execFileSync(process.execPath, [path.join(HERE, 'build-index.mjs')], { stdio: 'inherit' });
} else if (cmd === 'stats') {
  const ix = load();
  const by = {}, bv = {};
  for (const e of ix.entries) {
    by[e.wave] = (by[e.wave] || 0) + 1;
    bv[e.verdict] = (bv[e.verdict] || 0) + 1;
  }
  console.log(`perf-index: ${ix.count} entries (built ${ix.built})`);
  console.log('waves:  ', JSON.stringify(by));
  console.log('verdicts:', JSON.stringify(bv));
} else if (cmd === 'list') {
  const ix = load();
  const w = (args.find((a) => a === '--wave') ? args[args.indexOf('--wave') + 1] : null);
  const v = (args.find((a) => a === '--verdict') ? args[args.indexOf('--verdict') + 1] : null);
  for (const e of ix.entries) {
    if (w && e.wave !== w) continue;
    if (v && e.verdict !== v.toUpperCase()) continue;
    console.log(`${e.id}  [${e.verdict}]  ${e.topic}  ${eff(e)}`);
    console.log(`    ${(e.summary || '').slice(0, 140)}`);
  }
} else if (cmd === 'search') {
  const q = args.slice(1).join(' ');
  if (!q) { console.error('usage: perf.mjs search <query>'); process.exit(1); }
  const all = search(load(), q);
  const hits = all.slice(0, 15);
  if (!hits.length) console.log('no matches');
  else if (all.length > hits.length) console.log(`showing 15 of ${all.length} matches`);
  for (const e of hits) {
    console.log(`${e.id}  [${e.verdict}]  ${e.topic}  ${eff(e)}`);
    console.log(`    ${(e.summary || '').slice(0, 160)}`);
    console.log(`    ${e.report}${e.patch ? '  +  ' + e.patch : ''}`);
  }
} else if (cmd === 'show') {
  const id = (args[1] || '').toUpperCase();
  const e = load().entries.find((x) => x.id === id);
  if (!e) { console.error(`unknown id ${id}`); process.exit(1); }
  console.log(`${e.id}  [${e.kind}/${e.verdict}]  ${e.topic}  ${eff(e)}`);
  console.log(`report: ${e.report}`);
  if (e.patch) console.log(`patch:  ${e.patch}`);
  if (e.landedIn) console.log(`IN TREE via: ${e.landedIn}`);
  if (e.landing) console.log(`landed: ${e.landing}`);
  if (e.overruledBy) console.log(`OVERRULED BY: ${e.overruledBy}`);
  if (e.files?.length) console.log(`files:\n  ${e.files.join('\n  ')}`);
  console.log(`\n${e.summary || '(no summary)'}`);
  if (e.log) console.log(`\n--- LOG.md ---\n${e.log}`);
} else {
  console.error(`unknown command ${cmd} (list|search|show|stats|rebuild)`);
  process.exit(1);
}
