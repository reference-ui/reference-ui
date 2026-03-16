export interface DocsReferenceButtonProps {
  label: string
  disabled?: boolean
  variant: 'solid' | 'ghost'
  icon?: 'plus' | 'minus'
}

export type DocsReferenceButtonVariant = DocsReferenceButtonProps['variant']
