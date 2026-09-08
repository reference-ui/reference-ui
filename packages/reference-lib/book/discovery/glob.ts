import type { BookModule } from './types'

// Non-eager glob: only loads module when requested
export const storyLoaders: Record<string, () => Promise<BookModule>> = import.meta.glob(
  '../../src/components/**/*.book.{ts,tsx,js,jsx}'
)
