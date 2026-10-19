// Non-eager story loaders for Book discovery.
// It takes nothing and emits the import.meta.glob map over src **/*.book files; each
// module loads only when its story is requested.
import type { BookModule } from './types'

// Non-eager glob: only loads module when requested
export const storyLoaders: Record<string, () => Promise<BookModule>> = import.meta.glob([
  '../../src/components/**/*.book.{ts,tsx,js,jsx}',
  '../../src/core/**/*.book.{ts,tsx,js,jsx}',
])
