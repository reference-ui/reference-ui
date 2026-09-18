#!/usr/bin/env node
// CLI: node .agents/case-index/cli.mjs search <query> | list [--kind=neo|rs] | reindex
// Root alias: pnpm agent:cases <search|list|reindex> [args]

import { loadIndex, reindex, ROOT, tokenize } from './index.mjs';

const args = process.argv.slice(2);
const cmd = args[0];
const wantsHelp = args.includes('-h') || args.includes('--help');
const json = args.includes('--json');
const kindFlag = args.find((a) => a.startsWith('--kind='))?.split('=')[1];
const limitFlag = args.find((a) => a.startsWith('--limit='))?.split('=')[1];
const limit = limitFlag ? Number(limitFlag) : 15;
const query = args.find((a) => !a.startsWith('--') && a !== '-h' && a !== cmd);

const HELP = {
  search: `agent:cases search <query> [--limit=N] [--json]
  full-text search over neo cases + RS surfaces (default cap: 15 hits).
  terms are stemmed (queries/query match) and typo-tolerant (fuzzy+prefix).`,
  list: `agent:cases list [--kind=neo|rs] [--json]
  list indexed docs; the index auto-rebuilds first when sources changed.`,
  reindex: `agent:cases reindex [--json]
  force rebuild of the persisted index.`,
};

function usage(cmdName, exit = 0) {
  if (cmdName && HELP[cmdName]) console.log(`usage:\n  ${HELP[cmdName]}`);
  else {
    console.log(`usage:
  ${HELP.search}
  ${HELP.list}
  ${HELP.reindex}`);
  }
  process.exit(exit);
}

function noteRebuilt(rebuilt, manifest) {
  // stderr: stdout stays pure for --json consumers.
  if (rebuilt) console.error(`rebuilt index, ${manifest.counts.total} docs`);
}

if (!cmd || wantsHelp) usage(cmd && HELP[cmd] ? cmd : undefined, 0);

if (cmd === 'reindex') {
  const { manifest } = reindex(ROOT);
  if (json) console.log(JSON.stringify(manifest, null, 2));
  else {
    console.log(`rebuilt index: ${manifest.counts.total} docs ` +
      `(${manifest.counts.neo} neo + ${manifest.counts.rs} rs) from ${manifest.files} files`);
    console.log(`hash ${manifest.hash.slice(0, 12)} at ${manifest.builtAt}`);
  }
} else if (cmd === 'list') {
  const { docs, manifest, rebuilt } = loadIndex(ROOT);
  noteRebuilt(rebuilt, manifest);
  const rows = docs
    .filter((d) => !kindFlag || d.kind === kindFlag)
    .map((d) => ({
      id: d.id,
      kind: d.kind,
      ref: d.ref,
      title: d.title,
      path: d.path,
      ...(d.related?.length ? { related: d.related } : {}),
      ...(d.covers?.length ? { covers: d.covers } : {}),
      ...(d.kind === 'rs' ? { suites: d.suiteCount, cases: d.caseCount } : {}),
    }));
  if (json) console.log(JSON.stringify(rows, null, 2));
  else {
    for (const r of rows) {
      const extra = r.kind === 'rs' ? ` [${r.suites} suites, ${r.cases} cases]` : ` [${r.ref}]`;
      console.log(`${r.id} — ${r.title}${extra}\n  ${r.path}`);
    }
    console.log(`\n${rows.length} docs (index ${rebuilt ? 'rebuilt' : `from cache, ${manifest.builtAt}`})`);
  }
} else if (cmd === 'search') {
  if (!query) usage('search', 1);
  const { ms, manifest, rebuilt } = loadIndex(ROOT);
  noteRebuilt(rebuilt, manifest);
  const all = ms.search(query, { combineWith: 'AND' });
  const hits = all.slice(0, limit);
  const rows = hits.map((h) => ({
    id: h.id,
    score: +h.score.toFixed(3),
    kind: h.kind,
    ref: h.ref,
    title: h.title,
    path: h.path,
    match: h.match,
    ...(h.related?.length ? { related: h.related } : {}),
  }));
  const cut = all.length - hits.length;
  if (json) {
    console.log(JSON.stringify(rows, null, 2));
    if (cut > 0) console.error(`note: ${cut} more hit(s); raise --limit (default 15)`);
  } else if (!rows.length) {
    console.log(`no hits for "${query}" (index ${rebuilt ? 'rebuilt' : `from cache, ${manifest.builtAt}`})`);
    // Per-term correction: only terms with no exact match get a suggestion.
    const fixes = [];
    for (const term of new Set(tokenize(query))) {
      if (term.length < 3) continue;
      const exact = ms.search(term, { combineWith: 'AND', prefix: false, fuzzy: 0 });
      if (exact.length) continue;
      const sug = ms.autoSuggest(term, { fuzzy: 0.2 }).slice(0, 1);
      if (sug.length && sug[0].suggestion !== term.toLowerCase()) {
        fixes.push(`"${term}" → "${sug[0].suggestion}"`);
      }
    }
    if (fixes.length) console.log(`did you mean: ${fixes.join(', ')}?`);
  } else {
    for (const r of rows) {
      console.log(`${r.score.toFixed(3)}  ${r.id} — ${r.title} [${r.kind}:${r.ref}] (matched: ${Object.keys(r.match).join(', ')})`);
      console.log(`       ${r.path}`);
    }
    console.log(`\n${rows.length} hit(s) for "${query}"` +
      (cut > 0 ? ` (+${cut} more; use --limit=${all.length})` : ''));
  }
} else {
  usage(undefined, 1);
}
