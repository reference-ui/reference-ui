/**
 * Watch reference-core for changes and run ref sync
 * For development purposes only
 */
const { spawn } = require('child_process')
const { watch } = require('fs')
const path = require('path')

const coreDir = path.resolve(__dirname, '../../reference-core/src')
let debounceTimer = null
let isRunning = false

function runSync() {
  if (isRunning) return
  isRunning = true
  
  console.log('\n🔄 Core changed, running ref sync...')
  const proc = spawn('npx', ['ref', 'sync'], { 
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  })
  
  proc.on('close', () => {
    isRunning = false
    console.log('✅ Sync complete\n')
  })
}

console.log(`👀 Watching ${coreDir} for changes (excluding system/)...`)

watch(coreDir, { recursive: true }, (event, filename) => {
  if (!filename || filename.endsWith('.css')) return
  // Exclude src/system to avoid infinite loop (ref sync updates it)
  if (filename.startsWith('system') || filename.startsWith('system/')) return
  
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runSync, 300)
})

// Keep process alive
process.stdin.resume()
