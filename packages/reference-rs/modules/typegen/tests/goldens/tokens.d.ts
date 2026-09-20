export type ColorToken = 'brand.primary' | 'n100' | 'n300';

export type SpacingToken = '1' | '1/2r' | '1r' | '2' | '2r' | '4';

export type RadiusToken = 'full' | 'lg' | 'md' | 'none' | 'sm';

export type FontSizeToken = 'base' | 'lg' | 'sm' | 'xs';

export type FontWeightToken = 'bold' | 'medium' | 'regular';

export type LineHeightToken = 'normal' | 'tight';

export type ShadowToken = 'md' | 'overlay' | 'sm';

export type ZIndexToken = 'modal' | 'toast' | 'tooltip';

export interface Tokens {
  colors: ColorToken;
  spacing: SpacingToken;
  radii: RadiusToken;
  fontSizes: FontSizeToken;
  fontWeights: FontWeightToken;
  lineHeights: LineHeightToken;
  shadows: ShadowToken;
  zIndex: ZIndexToken;
}
