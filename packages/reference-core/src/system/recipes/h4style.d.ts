/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface H4StyleVariant {
  
}

type H4StyleVariantMap = {
  [key in keyof H4StyleVariant]: Array<H4StyleVariant[key]>
}



export type H4StyleVariantProps = {
  [key in keyof H4StyleVariant]?: ConditionalValue<H4StyleVariant[key]> | undefined
}

export interface H4StyleRecipe {
  
  __type: H4StyleVariantProps
  (props?: H4StyleVariantProps): string
  raw: (props?: H4StyleVariantProps) => H4StyleVariantProps
  variantMap: H4StyleVariantMap
  variantKeys: Array<keyof H4StyleVariant>
  splitVariantProps<Props extends H4StyleVariantProps>(props: Props): [H4StyleVariantProps, Pretty<DistributiveOmit<Props, keyof H4StyleVariantProps>>]
  getVariantProps: (props?: H4StyleVariantProps) => H4StyleVariantProps
}


export declare const h4Style: H4StyleRecipe