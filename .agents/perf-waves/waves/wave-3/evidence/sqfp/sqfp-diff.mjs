// Differential: original extractDemands (from HEAD) vs fastpath engine.
import rawIndex from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c880-8f31-70a2-81be-9c0d486d6061/packages/reference-mcp/src/data/icons-index.json' with { type: 'json' }
import { IconsSearchEngine } from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c880-8f31-70a2-81be-9c0d486d6061/packages/reference-mcp/src/pipeline/icons-search-index.ts'

function origExtract(input) {
  if (Array.isArray(input)) return input.map(s => s.trim()).filter(Boolean)
  let raw = (input || '').trim()
  if (!raw) return []
  const sentences = raw.split(/[.!?]+\s+/)
  const clauses = []
  for (const s of sentences) {
    const cleaned = s
      .replace(/^(can you (please )?(find|give me|show me)|i (need|want|am looking for|require))\s+(an?\s+)?(icons?\s+)?(for\s+)?/i, '')
      .replace(/^(icons?\s+for\s+|icons?\s+)/i, '')
      .trim()
    if (/^(i am|we are|building|working on|creating)\b/i.test(cleaned) && sentences.length > 1) continue
    const parts = cleaned
      .split(/[,;\n•]+|\s+and\s+/i)
      .map(p => p.trim().replace(/^[-*•\s]+/, '').replace(/^(a|an|the|for|to|with|about)\s+/i, '').replace(/\bicons?\b/gi, '').trim())
      .filter(p => p.length > 1)
    clauses.push(...parts)
  }
  return clauses.length > 0 ? clauses : [raw]
}

const engine = new IconsSearchEngine(rawIndex)
const tokens = ['trash', 'icon', 'icons', 'iconic', 'and', 'AND', 'a', 'an', 'the', 'for', 'to',
  'with', 'about', 'i', 'I', 'can you', 'Dr.', 'v2.0', 'x', '', ' ', 'home', 'andrew', 'andrews',
  'band', 'candy', 'theater', 'format', '-x', '*y', '•z', 'search!', 'what?', 'a.b', 'a. b']
const joins = [' ', '  ', ',', ', ', ';', '; ', '\n', '\r\n', ' and ', ' AND ', '  and  ', '. ', '! ', '? ', '... ', ' • ', '\tand\t', '&', ' + ', '.', '!', '?']
const corpus = new Set(['', ' ', '  ', ...tokens])
for (const t of tokens) { corpus.add(' ' + t + '  '); corpus.add(t + '.'); corpus.add(t + '!') }
for (const a of tokens) for (const j of joins) for (const b of tokens) corpus.add(a + j + b)
// targeted adversarials
for (const q of ['I need trash', 'i want a home', 'can you find search', 'can you please show me trash',
  'icons for home', 'icon for home', 'I am building x. Need trash', 'we are here. trash',
  'About page', 'about', 'About', 'FOR home', 'With style', 'To do', 'THE end', 'An apple',
  'A', 'a ', 'the ', 'the  trash', 'a\ttrash', 'one\ttwo and\tthree', 'fish & chips',
  'A AND B', 'sand and sea', 'Rock & Roll', 'end.', 'end. ', 'end.  next', 'U.S.A', 'e.g. this',
  'price $5.00 and tax', 'a.b.c', 'a. b. c', 'ICON', 'Icons', 'my icon set', 'icon-set',
  'the icon', 'an icon for settings', 'for icons', 'with icons and art']) corpus.add(q)

let n = 0, mism = 0
for (const q of corpus) {
  n++
  const a = JSON.stringify(origExtract(q)), b = JSON.stringify(engine.extractDemands(q))
  if (a !== b) { mism++; if (mism <= 10) console.log('MISMATCH', JSON.stringify(q), a, '=>', b) }
}
console.log(`corpus=${n} mismatches=${mism}`)
