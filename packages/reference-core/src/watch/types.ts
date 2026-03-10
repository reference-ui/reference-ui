export interface WatchPayload {
  sourceDir: string
  config: {
    include: string[]
  }
}

export type FileEvent = 'add' | 'change' | 'unlink'
