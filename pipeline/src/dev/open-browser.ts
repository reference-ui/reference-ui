import { execFile } from 'node:child_process'
import http from 'node:http'

export function openBrowser(url: string): void {
  const platform = process.platform
  if (platform === 'darwin') {
    execFile('open', [url], () => {})
  } else if (platform === 'win32') {
    execFile('cmd.exe', ['/c', 'start', '""', url], () => {})
  } else {
    execFile('xdg-open', [url], () => {})
  }
}

export function openBrowserWhenReady(url: string, maxWaitMs = 30000): void {
  const startTime = Date.now()
  const interval = 250
  let opened = false

  const check = () => {
    if (opened || Date.now() - startTime > maxWaitMs) {
      return
    }

    const req = http.get(url, () => {
      if (!opened) {
        opened = true
        openBrowser(url)
        console.log(`[pipeline dev] Opened ${url} in browser`)
      }
    })

    req.on('error', () => {
      if (!opened) {
        setTimeout(check, interval)
      }
    })

    req.setTimeout(1000, () => {
      req.destroy()
      if (!opened) {
        setTimeout(check, interval)
      }
    })
  }

  setTimeout(check, 500)
}
