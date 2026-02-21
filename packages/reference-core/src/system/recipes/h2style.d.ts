/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface H2StyleVariant {
  
}

type H2StyleVariantMap = {
  [key in keyof H2StyleVariant]: Array<H2StyleVariant[key]>
}



export type H2StyleVariantProps = {
  [key in keyof H2StyleVariant]?: ConditionalValue<H2StyleVariant[key]> | undefined
}

export interface H2StyleRecipe {
  
  __type: H2StyleVariantProps
  (props?: H2StyleVariantProps): string
  raw: (props?: H2StyleVariantProps) => H2StyleVariantProps
  variantMap: H2StyleVariantMap
  variantKeys: Array<keyof H2StyleVariant>
  splitVariantProps<Props extends H2StyleVariantProps>(props: Props): [H2StyleVariantProps, Pretty<DistributiveOmit<Props, keyof H2StyleVariantProps>>]
  getVariantProps: (props?: H2StyleVariantProps) => H2StyleVariantProps
}


export declare const h2Style: H2StyleRecipe