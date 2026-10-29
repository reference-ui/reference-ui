// Printers for the per-tag props types and the shared primitive extras of the Core react types.
// They take no input beyond the element roster: every tag gets the same three documented extras
// (css, colorMode, variant) that PrimitiveProps carries, plus the one PrimitiveVariant alias
// they all name, so Reference shows a meaningful type and a description for each.

import { ELEMENT_ROSTER } from '../../native/element-vocabulary.ts'

/** What `variant` takes, as exported declaration lines. */
export const PRIMITIVE_VARIANT_LINES = [
  '/** What `variant` takes: a string, stamped on the element as `data-variant`. */',
  'export type PrimitiveVariant = string',
]

/** The three primitive extras with their docs, shared by PrimitiveProps and every per-tag props type. */
export const PRIMITIVE_EXTRAS = [
  '  /** Style object for this element, applied like `css()`. It wins over a style prop for the same property. */',
  '  css?: PrimitiveCssProp',
  '  /** Sets the color mode for this element and everything inside it, whatever the page uses. Stamps `data-color-mode`. */',
  "  colorMode?: 'light' | 'dark'",
  '  /** Sets `data-variant` on the element, for `globalCss()` rules that select on it. */',
  '  variant?: PrimitiveVariant',
]

export function perTagDecls(): string[] {
  const lines: string[] = []
  for (const { dom: tag, jsx: name } of ELEMENT_ROSTER) {
    lines.push(
      `export type ${name}Props = Omit<React.ComponentPropsWithoutRef<${JSON.stringify(tag)}>, StylePropName | 'css' | 'colorMode' | 'variant'> & StyleProps & {`,
      ...PRIMITIVE_EXTRAS,
      '}',
      `export declare const ${name}: (props: ${name}Props & { ref?: React.Ref<React.ComponentRef<${JSON.stringify(tag)}>> }) => React.ReactNode`,
      ''
    )
  }
  return lines
}
