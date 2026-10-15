export interface FallbackProps {
  tone?: string
}

export function Fallback({ tone }: FallbackProps) {
  return <span data-tone={tone}>Fallback</span>
}
