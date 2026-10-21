import installNotes from './notes.md?raw'
import usageNotes from './notes.md#usage'

export interface NotesModule {
  installNotes: string
  usageNotes: string
}
