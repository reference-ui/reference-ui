// heap-probe.cjs — preload for the CORE-WATCH-32 watch process, run under --expose-gc. It takes the
// output path from CORE_WATCH_32_PROBE and wraps stdout and stderr: for the ready line and every sync line the
// watch prints, it waits until no further sync line arrives for longer than one pass, so a queued resync
// (an FSEvents dropped-events replay, or a poke that lands mid-pass) never puts a pass's working set in the
// sample. Then it collects garbage twice and appends one JSON line, `{ "sync": n, "heap": heapUsed }`, where n
// is the latest sync. It emits nothing else and never changes what the watch prints.
const fs = require('node:fs')

const out = process.env.CORE_WATCH_32_PROBE
// The baseline prints the ready block; every resync after it prints one sync line.
const SYNC_LINE = /ready in \d+ ms|ref sync ⫶/
// Longer than one resync, so the sample waits out any pass queued behind the one that printed.
const SETTLE_MS = 1000
let syncs = 0
let pending

function sample(sync) {
  global.gc()
  global.gc()
  fs.appendFileSync(out, `${JSON.stringify({ sync, heap: process.memoryUsage().heapUsed })}\n`)
}

for (const stream of [process.stdout, process.stderr]) {
  const write = stream.write.bind(stream)
  stream.write = (chunk, ...rest) => {
    for (const line of String(chunk).split('\n')) {
      if (!SYNC_LINE.test(line)) continue
      syncs += 1
      const n = syncs
      clearTimeout(pending)
      pending = setTimeout(() => sample(n), SETTLE_MS)
      pending.unref()
    }
    return write(chunk, ...rest)
  }
}
