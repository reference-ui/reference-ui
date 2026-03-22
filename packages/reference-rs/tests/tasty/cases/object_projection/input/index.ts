export interface CoreStyleProps {
  tone?: 'primary' | 'secondary'
  color?: string
}

export interface BaseStyleProps extends CoreStyleProps {
  size?: number
}

export interface LayoutProps {
  display?: 'block' | 'inline'
}

export type InlinePatternProps = {
  gap?: string
}

export type ObjectAliasProps = {
  radius?: number
}

export type ProjectedStyleProps =
  & Omit<BaseStyleProps, 'color'>
  & InlinePatternProps
  & Pick<LayoutProps, 'display'>

export type PublicProjectedStyleProps = ProjectedStyleProps

export type UnprojectableStyleProps = Record<string, string> & InlinePatternProps
