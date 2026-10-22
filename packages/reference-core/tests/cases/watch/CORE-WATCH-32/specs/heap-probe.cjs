// heap-probe.cjs — preload for the CORE-WATCH-32 watch process, run under --expose-gc. It takes the
// output path from CORE_WATCH_32_PROBE and wraps stdout and stderr: for the ready line and every sync line the
// watch prints, it waits for the pass to settle, collects garbage twice and appends one JSON line,
// `{ "sync": n, "heap": heapUsed }`. It emits nothing else and never changes what the watch prints.
const fs = require('node:fs')

const out = process.env.CORE_WATCH_32_PROBE
// The baseline prints the ready block; every resync after it prints one sync line.
const SYNC_LINE = /ready in \d+ ms|ref sync ⫶/
const SETTLE_MS = 300
let syncs = 0

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
      setTimeout(() => sample(n), SETTLE_MS).unref()
    }
    return write(chunk, ...rest)
  }
}
