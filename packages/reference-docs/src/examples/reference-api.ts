export interface DocsReferenceButtonProps {
  label: string
  disabled?: boolean
  variant: 'solid' | 'ghost' | 'another'
  icon?: 'plus' | 'minus'
}

export type DocsReferenceButtonVariant = DocsReferenceButtonProps['variant']
