// perf.mjs — agent-perf index CLI. Start with `node perf.mjs --help`.
import { execFileSync } from 'node:child_process';
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

// Substring match score; -1 = no match. Substring-AND by design: looser
// subsequence matching made nonsense queries return confident hits.
function substrScore(q, s) {
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
        const s = substrScore(w, text || '');
        if (s > best) best = s * wt;
      }
      if (best < 0) { score = -1; break; }
      score += best;
    }
    if (score >= 0) out.push([score, e]);
  }
  return out.sort((a, b) => b[0] - a[0]).map(([, e]) => e);
}

const HELP = `agent-perf index CLI — every verdict ever filed.

usage:
  perf.mjs list [--wave <w>] [--verdict <v>] [--limit <n>]
  perf.mjs search <query...> [--limit <n>|--all]
  perf.mjs show <PERF-...|INT-...>
  perf.mjs stats
  perf.mjs rebuild
  perf.mjs help|--help|-h [<command>]

match semantics: search ANDs case-insensitive substring matches over
topic, id, verdict, summary, and LOG text. It is NOT fuzzy: a query
word must appear verbatim in at least one field. Filters are
case-insensitive. Unknown flags and mistyped commands are rejected —
nothing runs on ambiguous input, and rebuild never runs with args.`;

const CMD_HELP = {
  list: `usage: perf.mjs list [--wave <wave>] [--verdict <verdict>] [--limit <n>]
roster of index entries (newest filing order). Filters are
case-insensitive; known values via 'stats'. --limit caps the dump.`,
  search: `usage: perf.mjs search <query...> [--limit <n>|--all]
AND of case-insensitive substring matches over topic/id/verdict/
summary/LOG. Default cap 15 hits (--all removes it). A bare 'no
matches' also reports per-word hit counts and closest partial hits
so a negative is actionable, not a dead end.`,
  show: `usage: perf.mjs show <PERF-...|INT-...>
full entry: files, numbers, report/patch paths, LOG text.`,
  stats: `usage: perf.mjs stats
counts by wave/verdict. Takes no arguments.`,
  rebuild: `usage: perf.mjs rebuild
regenerates perf-index.json from filings + LOG.md. Takes no
arguments — any extra argument refuses to run (a mistyped probe
must never silently rewrite institutional memory).`,
};

const fail = (msg) => { console.error(msg); process.exit(1); };
const args = process.argv.slice(2);
const wantsHelp = (a) => a === '--help' || a === '-h' || a === 'help';

// Split leading command from the rest; --help/-h/help anywhere requests
// help for the resolved command (or global help when there is none).
let cmd = args[0] || 'list';
if (wantsHelp(cmd)) {
  const about = args[1];
  if (about && CMD_HELP[about]) { console.log(CMD_HELP[about]); process.exit(0); }
  if (about && !wantsHelp(about)) fail(`unknown command ${about} (list|search|show|stats|rebuild)`);
  console.log(HELP);
  process.exit(0);
}
if (!CMD_HELP[cmd]) fail(`unknown command ${cmd} (list|search|show|stats|rebuild)\ntry: perf.mjs --help`);
const rest = args.slice(1);
if (rest.some(wantsHelp)) { console.log(CMD_HELP[cmd]); process.exit(0); }

// Tiny strict flag parser: known flags with values in SPEC, unknown
// --flags rejected, bare words returned as positionals.
function parseFlags(list, spec) {
  const flags = {}, pos = [];
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const name = a.slice(2);
    const takesValue = spec[name];
    if (takesValue === undefined) fail(`unknown flag ${a} for '${cmd}'\ntry: perf.mjs ${cmd} --help`);
    if (takesValue) {
      const v = list[++i];
      if (v === undefined || v.startsWith('--')) fail(`flag ${a} needs a value\ntry: perf.mjs ${cmd} --help`);
      flags[name] = v;
    } else flags[name] = true;
  }
  return { flags, pos };
}

function parseLimit(flags) {
  if (flags.all) return Infinity;
  if (flags.limit === undefined) return undefined;
  const n = Number(flags.limit);
  if (!Number.isInteger(n) || n <= 0) fail(`--limit needs a positive integer, got '${flags.limit}'`);
  return n;
}

if (cmd === 'rebuild') {
  if (rest.length) fail(`rebuild takes no arguments — refusing to run (got: ${rest.join(' ')})\ntry: perf.mjs rebuild --help`);
  execFileSync(process.execPath, [path.join(HERE, 'build-index.mjs')], { stdio: 'inherit' });
} else if (cmd === 'stats') {
  if (rest.length) fail(`stats takes no arguments (got: ${rest.join(' ')})\ntry: perf.mjs stats --help`);
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
  const { flags, pos } = parseFlags(rest, { wave: true, verdict: true, limit: true });
  if (pos.length) fail(`list takes no bare arguments (got: ${pos.join(' ')})\ntry: perf.mjs list --help`);
  const limit = parseLimit(flags) ?? Infinity;
  const ix = load();
  const w = flags.wave?.toLowerCase(), v = flags.verdict?.toUpperCase();
  let shown = 0, matched = 0;
  for (const e of ix.entries) {
    if (w && String(e.wave).toLowerCase() !== w) continue;
    if (v && String(e.verdict).toUpperCase() !== v) continue;
    matched++;
    if (shown >= limit) continue;
    shown++;
    console.log(`${e.id}  [${e.verdict}]  ${e.topic}  ${eff(e)}`);
    console.log(`    ${(e.summary || '').slice(0, 140)}`);
  }
  console.log(matched > shown
    ? `listed ${shown} of ${matched} entries (--limit ${flags.limit})`
    : `listed ${matched} of ${ix.count} entries`);
} else if (cmd === 'search') {
  const { flags, pos } = parseFlags(rest, { limit: true, all: false });
  const q = pos.join(' ');
  if (!q) fail(`usage: perf.mjs search <query...> [--limit <n>|--all]`);
  const limit = parseLimit(flags) ?? 15;
  const ix = load();
  const all = search(ix, q);
  if (!all.length) {
    console.log(`no matches for '${q}' (${ix.count} entries, index built ${ix.built})`);
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    for (const word of words) {
      console.log(`  '${word}' alone: ${search(ix, word).length} hits`);
    }
    // Closest partial hits: entries matching the most query words.
    const partial = [];
    for (const e of ix.entries) {
      const hay = [e.topic, e.id, e.verdict, e.summary || '', e.log || ''].join('\n').toLowerCase();
      const n = words.filter((word) => hay.includes(word)).length;
      if (n > 0) partial.push([n, e]);
    }
    partial.sort((a, b) => b[0] - a[0]);
    for (const [n, e] of partial.slice(0, 3)) {
      console.log(`  closest: ${e.id} [${e.verdict}] ${e.topic} (${n}/${words.length} words)`);
    }
    if (!partial.length) console.log(`  nothing shares a word — try 'stats' or 'list' to browse`);
    process.exit(0);
  }
  const hits = all.slice(0, limit);
  console.log(all.length > hits.length
    ? `${all.length} matches, showing ${hits.length} (--all for all)`
    : `${all.length} match${all.length === 1 ? '' : 'es'}`);
  for (const e of hits) {
    console.log(`${e.id}  [${e.verdict}]  ${e.topic}  ${eff(e)}`);
    console.log(`    ${(e.summary || '').slice(0, 160)}`);
    console.log(`    ${e.report}${e.patch ? '  +  ' + e.patch : ''}`);
  }
} else if (cmd === 'show') {
  const { pos } = parseFlags(rest, {});
  if (pos.length !== 1) fail(`usage: perf.mjs show <PERF-...|INT-...>`);
  const id = (pos[0] || '').toUpperCase();
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
}
