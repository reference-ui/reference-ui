export interface BannerProps {
  tone?: string
}

export function Banner({ tone }: BannerProps) {
  return <span data-tone={tone}>Banner</span>
}
