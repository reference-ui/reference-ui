export interface WatchPayload {
  projectRoot: string
  config: {
    include: string[]
    dependencyPaths?: string[]
  }
}

export type FileEvent = 'add' | 'change' | 'unlink'
