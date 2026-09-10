/** CSS properties whose transitions move or resize layout, not paint. */
export const LAYOUT_PROPERTIES = [
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'transform',
  'translate',
  'left',
  'top',
  'right',
  'bottom',
  'inset',
  'margin',
  'padding',
  'scale',
  'rotate',
  'flex-basis',
  'gap',
  'row-gap',
  'column-gap',
] as const

export function isLayoutProperty(propertyName: string): boolean {
  if (!propertyName) return false
  if ((LAYOUT_PROPERTIES as readonly string[]).includes(propertyName)) return true
  return (
    propertyName.startsWith('margin') ||
    propertyName.startsWith('padding') ||
    propertyName.startsWith('inset') ||
    propertyName.startsWith('inset-')
  )
}
