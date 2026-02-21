/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface H6StyleVariant {
  
}

type H6StyleVariantMap = {
  [key in keyof H6StyleVariant]: Array<H6StyleVariant[key]>
}



export type H6StyleVariantProps = {
  [key in keyof H6StyleVariant]?: ConditionalValue<H6StyleVariant[key]> | undefined
}

export interface H6StyleRecipe {
  
  __type: H6StyleVariantProps
  (props?: H6StyleVariantProps): string
  raw: (props?: H6StyleVariantProps) => H6StyleVariantProps
  variantMap: H6StyleVariantMap
  variantKeys: Array<keyof H6StyleVariant>
  splitVariantProps<Props extends H6StyleVariantProps>(props: Props): [H6StyleVariantProps, Pretty<DistributiveOmit<Props, keyof H6StyleVariantProps>>]
  getVariantProps: (props?: H6StyleVariantProps) => H6StyleVariantProps
}


export declare const h6Style: H6StyleRecipe