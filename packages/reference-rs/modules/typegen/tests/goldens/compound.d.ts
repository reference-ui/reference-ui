export type ButtonVariantProps = { size?: 'lg' | 'sm'; tone?: 'loud' | 'quiet' }

export type ButtonCompoundVariant = {
  size?: 'lg' | 'sm'
  tone?: 'loud' | 'quiet'
  css: { [property: string]: string }
}
