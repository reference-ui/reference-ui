import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin, ViteDevServer, HmrContext } from 'vite'
import type { BookPerfRecord } from './types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgDir = resolve(__dirname, '../..')
const perfJsonlPath = resolve(pkgDir, '.reference-ui/book-perf.jsonl')

export function bookPerfPlugin(): Plugin {
  let server: ViteDevServer | null = null
  let coldStartTime = Date.now()
  const transformTimes = new Map<string, number>()

  function appendPerfRecord(record: BookPerfRecord) {
    try {
      mkdirSync(dirname(perfJsonlPath), { recursive: true })
      appendFileSync(perfJsonlPath, JSON.stringify(record) + '\n')
    } catch {
      // Ignore write errors
    }
  }

  return {
    name: 'book:perf',

    configureServer(devServer: ViteDevServer) {
      server = devServer
      const coldStartMs = Date.now() - coldStartTime

      appendPerfRecord({
        t: new Date().toISOString(),
        file: 'startup',
        deferred: false,
        fullReload: false,
        modules: 0,
        syncMs: 0,
        viteTransformMs: 0,
        viteHmrMs: coldStartMs,
        clientApplyMs: 0,
        storyImportMs: 0,
      })

      // Send perf updates to connected clients
      devServer.ws.on('book:client-perf', (data: any) => {
        if (data && typeof data === 'object') {
          appendPerfRecord({
            t: new Date().toISOString(),
            ...data,
          })
        }
      })
    },

    transform(_code, id) {
      transformTimes.set(id, Date.now())
    },

    handleHotUpdate(ctx: HmrContext) {
      const hmrStart = Date.now()
      const file = ctx.file
      const moduleCount = ctx.modules.length

      const isStory = file.includes('.book.') || file.includes('.fixture.')
      const isBookApp = file.includes('/book/')
      const isManaged = file.includes('/.reference-ui/')

      const deferred = isManaged || (!isStory && !isBookApp && (file.includes('/theme/') || file.includes('/tokens/')))

      const record: BookPerfRecord = {
        t: new Date().toISOString(),
        file: file.replace(pkgDir + '/', ''),
        deferred,
        fullReload: false,
        modules: moduleCount,
        syncMs: deferred ? 0 : 0,
        viteTransformMs: 0,
        viteHmrMs: Date.now() - hmrStart,
        clientApplyMs: null,
        storyImportMs: null,
      }

      appendPerfRecord(record)

      if (server) {
        server.ws.send({
          type: 'custom',
          event: 'book:perf',
          data: record,
        })
      }
    },
  }
}
