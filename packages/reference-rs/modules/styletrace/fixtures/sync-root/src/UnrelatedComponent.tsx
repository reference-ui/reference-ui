/**
 * Unrelated PascalCase component using standard HTML elements and no Reference primitives.
 * Proves that styletrace does not treat components as style hosts merely due to PascalCase naming.
 * Emits an excluded non-style component during wrapper analysis.
 */
export interface UnrelatedComponentProps {
  text: string
}

export function UnrelatedComponent({ text }: UnrelatedComponentProps) {
  return <div>{text}</div>
}
