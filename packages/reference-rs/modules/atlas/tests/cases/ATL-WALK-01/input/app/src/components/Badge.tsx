export interface BadgeProps {
  tone?: string
}

export function Badge({ tone }: BadgeProps) {
  return <span data-tone={tone}>Badge</span>
}
