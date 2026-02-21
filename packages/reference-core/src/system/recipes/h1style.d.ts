/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface H1StyleVariant {
  
}

type H1StyleVariantMap = {
  [key in keyof H1StyleVariant]: Array<H1StyleVariant[key]>
}



export type H1StyleVariantProps = {
  [key in keyof H1StyleVariant]?: ConditionalValue<H1StyleVariant[key]> | undefined
}

export interface H1StyleRecipe {
  
  __type: H1StyleVariantProps
  (props?: H1StyleVariantProps): string
  raw: (props?: H1StyleVariantProps) => H1StyleVariantProps
  variantMap: H1StyleVariantMap
  variantKeys: Array<keyof H1StyleVariant>
  splitVariantProps<Props extends H1StyleVariantProps>(props: Props): [H1StyleVariantProps, Pretty<DistributiveOmit<Props, keyof H1StyleVariantProps>>]
  getVariantProps: (props?: H1StyleVariantProps) => H1StyleVariantProps
}


export declare const h1Style: H1StyleRecipe