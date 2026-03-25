export interface WatchPayload {
  projectRoot: string
  config: {
    include: string[]
  }
}

export type FileEvent = 'add' | 'change' | 'unlink'
