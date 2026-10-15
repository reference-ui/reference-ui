export interface LabelProps {
  tone?: string
}

export function Label({ tone }: LabelProps) {
  return <span data-tone={tone}>Label</span>
}
