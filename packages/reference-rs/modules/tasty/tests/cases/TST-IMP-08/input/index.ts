import installNotes from './notes.md?raw'
import usageNotes from './notes.md#usage'
import src from './helper.ts?raw'

export interface NotesModule {
  installNotes: string
  usageNotes: string
  source: src
}
