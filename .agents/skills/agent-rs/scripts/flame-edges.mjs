/**
 * Deduped per-sample call-edge graphs over a filed flame bundle.
 *
 * Raw edge counts inflate on recursion (the interpreter self-edge would
 * report 541% of the run), so every builder here counts each parent-child
 * pair once per sample. Keys join library and frame name so same-named
 * frames in different libraries never merge. Powers spine folding in the
 * query views and the edge tables in the filed caller attribution.
 */

function edgeKey(lib, name) {
  return `${lib}\n${name}`
}

function addEdgeWeight(kids, parent, child, weight) {
  let entry = kids.get(parent)
  if (!entry) {
    entry = new Map()
    kids.set(parent, entry)
  }
  entry.set(child, (entry.get(child) ?? 0) + weight)
}

function dedupedSampleEdges(keyOf, sample) {
  const seen = new Set()
  const edges = []
  for (let i = 1; i < sample.f.length; i += 1) {
    const edge = `${keyOf(sample.f[i - 1])}→${keyOf(sample.f[i])}`
    if (seen.has(edge)) continue
    seen.add(edge)
    edges.push([keyOf(sample.f[i - 1]), keyOf(sample.f[i])])
  }
  return edges
}

function mergeSampleEdges(kids, keyOf, sample) {
  for (const [parent, child] of dedupedSampleEdges(keyOf, sample)) {
    addEdgeWeight(kids, parent, child, sample.w)
  }
}

export function funcChildren(bundle, samples) {
  const kids = new Map()
  const keyOf = (fi) => edgeKey(bundle.frameLib[fi], bundle.frameName[fi])
  for (const sample of samples) mergeSampleEdges(kids, keyOf, sample)
  return kids
}

// Native-only edge table over TRUE adjacencies: both frames native and
// adjacent on the stack. Projecting to native frames first would invent
// transitive edges across foreign frames (N-API re-entry), so the filter
// stays on the pair, not the chain.
export function nativeEdgeTable(bundle, samples) {
  const by = new Map()
  for (const sample of samples) {
    for (const key of dedupedNativeSampleEdges(bundle, sample)) {
      by.set(key, (by.get(key) ?? 0) + sample.w)
    }
  }
  return by
}

function dedupedNativeSampleEdges(bundle, sample) {
  const seen = new Set()
  const edges = []
  for (let i = 1; i < sample.f.length; i += 1) {
    const [prev, curr] = [sample.f[i - 1], sample.f[i]]
    if (!bothNative(bundle, prev, curr)) continue
    const key = `${bundle.frameName[prev]} → ${bundle.frameName[curr]}`
    if (seen.has(key)) continue
    seen.add(key)
    edges.push(key)
  }
  return edges
}

function bothNative(bundle, prev, curr) {
  return bundle.frameLib[prev].endsWith('.node') && bundle.frameLib[curr].endsWith('.node')
}
