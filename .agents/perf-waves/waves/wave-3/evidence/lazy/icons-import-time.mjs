// Fresh-process import timer: prints ms to dynamically import the bundle.
const bundle = process.argv[2]
const t0 = performance.now()
await import(bundle)
console.log((performance.now() - t0).toFixed(2))
