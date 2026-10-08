import { tokens } from './values'
import { tokens as aliasedTokens } from './values-aliased'

export type ImportedSpacingScale = typeof tokens.spacing
export type AliasedSpacingScale = typeof aliasedTokens.spacing

export interface WithImportedTypeQueries {
  spacing: typeof tokens.spacing
  aliased: typeof aliasedTokens.spacing
}
