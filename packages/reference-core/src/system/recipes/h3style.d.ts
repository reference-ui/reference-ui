/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface H3StyleVariant {
  
}

type H3StyleVariantMap = {
  [key in keyof H3StyleVariant]: Array<H3StyleVariant[key]>
}



export type H3StyleVariantProps = {
  [key in keyof H3StyleVariant]?: ConditionalValue<H3StyleVariant[key]> | undefined
}

export interface H3StyleRecipe {
  
  __type: H3StyleVariantProps
  (props?: H3StyleVariantProps): string
  raw: (props?: H3StyleVariantProps) => H3StyleVariantProps
  variantMap: H3StyleVariantMap
  variantKeys: Array<keyof H3StyleVariant>
  splitVariantProps<Props extends H3StyleVariantProps>(props: Props): [H3StyleVariantProps, Pretty<DistributiveOmit<Props, keyof H3StyleVariantProps>>]
  getVariantProps: (props?: H3StyleVariantProps) => H3StyleVariantProps
}


export declare const h3Style: H3StyleRecipe