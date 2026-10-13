export interface Local {
  id: string
}

declare global {
  interface Window {
    tastyProbe: number
  }
}
