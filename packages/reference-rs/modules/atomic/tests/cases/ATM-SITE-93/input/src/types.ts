export type StyleProps = {
  color?: string
}

export type TileProps = StyleProps & {
  size?: 'sm' | 'md' | 'lg'
  tone?: 'quiet' | 'loud'
}
