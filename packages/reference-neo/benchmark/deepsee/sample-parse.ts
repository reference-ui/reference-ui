// Parser for macOS `sample` call-graph output into burndown phase buckets.
// It takes the sample text, attributes leaf samples (self time) to phases by
// demangled symbol substrings, and emits counts plus the idle share. Leaf-only
// attribution keeps every sample counted once: intermediate frames carry
// inclusive weights and are never double-counted. Anything unmatched lands in
// `other` (reported, never hidden); sleep frames land in `idle` (excluded).

export interface SampleBuckets {
  total: number
  idle: number
  nonIdle: number
  phases: Record<string, number>
  otherSymbols: { symbol: string; samples: number }[]
}

interface Frame {
  depth: number
  count: number
  symbol: string
  binary: string
}

interface Rule {
  phase: string
  match: (symbol: string, binary: string) => boolean
}

function has(symbol: string, ...needles: string[]): boolean {
  return needles.some((needle) => symbol.includes(needle))
}

const IDLE_NEEDLES = [
  'kevent',
  'mach_msg',
  '__semwait',
  'semaphore_wait_trap',
  'pthread_cond_wait',
  '__psynch',
  'select$DARWIN',
  'poll$DARWIN',
  '__poll',
  'nanosleep',
  'sigsuspend',
  '__ulock_wait',
  'thread_start',
  '_pthread_start',
]

const RULES: Rule[] = [
  { phase: 'idle', match: (symbol) => has(symbol, ...IDLE_NEEDLES) },
  {
    phase: 'alloc',
    match: (symbol) =>
      has(
        symbol,
        'malloc',
        'free',
        'realloc',
        'calloc',
        'operator new',
        'mi_',
        'je_',
        'alloc::',
        'hashbrown',
        'indexmap::',
        '__memcpy',
        '__memmove',
        '_platform_memmove',
        '__strlen',
        'memcmp',
        'madvise',
        'mmap',
        'munmap',
        'mprotect',
      ),
  },
  { phase: 'serde', match: (symbol) => has(symbol, 'serde', 'simd_json', 'ryu::', 'itoa::', 'to_string', 'from_str', 'JSON::Parse', 'json::parse') },
  { phase: 'napi-bridge', match: (symbol) => has(symbol, 'reference_virtual_native', '__napi__', 'napi::', 'FunctionCallbackWrapper', 'CallApiCallback') },
  { phase: 'scan/read', match: (symbol) => has(symbol, 'sources::collect', 'scan_dir', 'read_to_string', 'walkdir', 'glob::', 'ignore::', 'collect_compile_files', 'ReadFile', 'fs::read') },
  { phase: 'parse', match: (symbol) => has(symbol, 'oxc_parser', 'oxc_allocator', 'oxc_ast', 'parse_source', 'Parser::parse', 'from_path') },
  { phase: 'constants', match: (symbol) => has(symbol, 'constants::', 'LocalConstants', 'ValueGraph', 'resolver::', 'merge') },
  { phase: 'hosts', match: (symbol) => has(symbol, 'hosts::', 'styletrace', 'traced_jsx', 'IdentityGraph') },
  { phase: 'extract', match: (symbol) => has(symbol, 'extract::', 'ExtractVisitor', 'extract_with_context', 'extract_parsed_program', 'scope::', 'bindings', 'ScopeChain', 'visit_program') },
  { phase: 'harvest', match: (symbol) => has(symbol, 'harvest::', 'collect_pool', '::mint') },
  { phase: 'diagnostics', match: (symbol) => has(symbol, 'diagnostics::', 'analysis::', 'proof::', 'partition_channels', 'report_') },
  { phase: 'assembly', match: (symbol) => has(symbol, 'assembly::', 'AssembleCtx', 'build_atom_set', 'resolve::', 'AtomSet', 'recipes::compile', 'push_rule', 'static_css', 'check_container_root') },
  { phase: 'emit', match: (symbol) => has(symbol, 'stylesheet::', 'build_stylesheet', 'build_portable', 'write_utilities', 'emit_recipe', 'group_recipe', 'append_system_layers', 'append_tokens', 'cascade::', 'format_declaration') },
  { phase: 'base-system', match: (symbol) => has(symbol, 'base_system', 'lower_base_system', 'BaseSystem::from_json') },
  { phase: 'ts', match: (_symbol, binary) => binary === 'node' || binary === '<unknown binary>' },
  { phase: 'ts', match: (symbol) => has(symbol, 'v8::', 'uv_', 'libuv', 'Builtins_', 'node::') },
]

function bucketize(symbol: string, binary: string): string {
  for (const rule of RULES) {
    if (rule.match(symbol, binary)) return rule.phase
  }
  return 'other'
}

function mainThreadBody(text: string): string {
  const start = text.indexOf('Call graph:')
  const end = text.indexOf('Binary Images:')
  const body = text.slice(start === -1 ? 0 : start, end === -1 ? text.length : end)
  const sections = body.split(/^\s*\d+ Thread_/m)
  if (sections.length <= 1) return body
  const headers = body.match(/^\s*\d+ Thread_.*$/gm) ?? []
  let fallback = 1
  for (let i = 0; i < headers.length; i += 1) {
    if ((headers[i] as string).includes('main-thread')) return sections[i + 1] as string
    if ((sections[i + 1] as string).includes('compile_system')) fallback = i + 1
  }
  return sections[fallback] as string
}

function isArtChar(ch: string | undefined): boolean {
  return ch === ' ' || ch === '+' || ch === '|' || ch === ':' || ch === '!'
}

function scanEdge(line: string): number {
  let edge = 4
  while (edge < line.length && isArtChar(line[edge])) edge += 1
  return edge
}

function parseFrameLine(line: string): Frame | null {
  if (!line.includes('(in ')) return null
  if (!line.startsWith('    ')) return null
  const edge = scanEdge(line)
  const rest = line.slice(edge)
  const count = /^(\d+)\s+/.exec(rest)
  if (!count) return null
  const depth = (edge - 4) / 2
  if (!Number.isInteger(depth) || depth < 0) return null
  const symbolPart = rest.slice(count[0].length)
  const binaryAt = symbolPart.lastIndexOf('(in ')
  if (binaryAt === -1) return null
  const symbol = symbolPart.slice(0, binaryAt).trim()
  const binary = symbolPart.slice(binaryAt + 4).split(')')[0]?.trim() ?? ''
  return { depth, count: Number(count[1]), symbol, binary }
}

function parseFrames(text: string): Frame[] {
  const frames: Frame[] = []
  for (const line of mainThreadBody(text).split('\n')) {
    const frame = parseFrameLine(line)
    if (frame) frames.push(frame)
  }
  return frames
}

function attributeLeaf(stack: Frame[], leaf: Frame): string {
  if (bucketize(leaf.symbol, leaf.binary) === 'idle') return 'idle'
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const frame = stack[i] as Frame
    const phase = bucketize(frame.symbol, frame.binary)
    if (phase !== 'other' && phase !== 'idle' && phase !== 'alloc') return phase
  }
  return bucketize(leaf.symbol, leaf.binary)
}

export function parseSample(text: string): SampleBuckets {
  const frames = parseFrames(text)
  const phases: Record<string, number> = {}
  const other = new Map<string, number>()
  const add = (phase: string, count: number): void => {
    phases[phase] = (phases[phase] ?? 0) + count
  }
  const stack: Frame[] = []
  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i] as Frame
    while (stack.length > 0 && (stack[stack.length - 1] as Frame).depth >= frame.depth) {
      stack.pop()
    }
    stack.push(frame)
    const next = frames[i + 1]
    const isLeaf = next === undefined || next.depth <= frame.depth
    if (!isLeaf) continue
    const phase = attributeLeaf(stack, frame)
    add(phase, frame.count)
    if (phase === 'other') {
      other.set(frame.symbol, (other.get(frame.symbol) ?? 0) + frame.count)
    }
  }
  const total = Object.values(phases).reduce((n, c) => n + c, 0)
  const idle = phases['idle'] ?? 0
  const otherSymbols = [...other.entries()]
    .map(([symbol, samples]) => ({ symbol, samples }))
    .sort((a, b) => b.samples - a.samples)
    .slice(0, 10)
  return { total, idle, nonIdle: total - idle, phases, otherSymbols }
}
