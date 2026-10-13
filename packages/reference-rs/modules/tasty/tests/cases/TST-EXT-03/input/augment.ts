import type { Base } from './base'

declare module './base' {
  interface Base {
    extra: number
  }
}
