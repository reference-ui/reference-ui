import { defineReferenceTable } from '../../../reference-core/src/reference/table'
import type { ReferenceTable } from '../../../reference-core/src/reference/types'

const colorPropsTable = defineReferenceTable({
  kind: 'api-table',
  id: 'color-props',
  title: 'ColorProps',
  description: 'Props accepted by the single color swatch row used throughout the docs.',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'required', label: 'Required' },
    { key: 'description', label: 'Description' },
  ],
  rows: [
    {
      name: { text: 'name', code: true },
      type: { text: 'string', code: true },
      required: true,
      description: 'Human-readable token label shown next to the swatch.',
    },
    {
      name: { text: 'value', code: true },
      type: { text: 'string', code: true },
      required: true,
      description: 'Resolved CSS color value used to paint the preview block.',
    },
  ],
} satisfies ReferenceTable)

const colorsPropsTable = defineReferenceTable({
  kind: 'api-table',
  id: 'colors-props',
  title: 'ColorsProps',
  description: 'Controls whether the docs render the full palette, one palette, or one swatch.',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'required', label: 'Required' },
    { key: 'description', label: 'Description' },
  ],
  rows: [
    {
      name: { text: 'palette', code: true },
      type: { text: 'string', code: true },
      required: false,
      description: 'When provided, narrows the output to a single palette like `blue`.',
    },
    {
      name: { text: 'shade', code: true },
      type: { text: 'string', code: true },
      required: false,
      description: 'When paired with `palette`, renders a single shade like `600`.',
    },
  ],
} satisfies ReferenceTable)

export const colorsApiTables: readonly ReferenceTable[] = [colorPropsTable, colorsPropsTable]
