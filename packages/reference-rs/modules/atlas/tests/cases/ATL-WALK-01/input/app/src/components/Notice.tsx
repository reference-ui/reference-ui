export interface NoticeProps {
  tone?: string
}

export function Notice({ tone }: NoticeProps) {
  return <span data-tone={tone}>Notice</span>
}
