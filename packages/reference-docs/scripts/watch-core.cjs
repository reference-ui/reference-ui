/**
 * Watch reference-lib for changes and run ref sync
 * For development purposes only
 */
const { spawn } = require('child_process')
const { watch } = require('fs')
const path = require('path')

const libDir = path.resolve(__dirname, '../../reference-lib/src')
let debounceTimer = null
let isRunning = false

function runSync() {
  if (isRunning) return
  isRunning = true

  console.log('\n🔄 Reference lib changed, running ref sync...')
  const proc = spawn('npx', ['ref', 'sync'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
  })

  proc.on('close', () => {
    isRunning = false
    console.log('✅ Sync complete\n')
  })
}

console.log(`👀 Watching ${libDir} for changes (excluding system/, primitives/)...`)

watch(libDir, { recursive: true }, (event, filename) => {
  if (!filename || filename.endsWith('.css')) return
  // Exclude paths that ref sync writes to (avoid loop: sync → these change → sync again)
  if (filename.startsWith('system') || filename.startsWith('system/')) return
  if (filename.startsWith('primitives')) return

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runSync, 300)
})

// Keep process alive
process.stdin.resume()
