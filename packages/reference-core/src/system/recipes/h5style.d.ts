/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface H5StyleVariant {
  
}

type H5StyleVariantMap = {
  [key in keyof H5StyleVariant]: Array<H5StyleVariant[key]>
}



export type H5StyleVariantProps = {
  [key in keyof H5StyleVariant]?: ConditionalValue<H5StyleVariant[key]> | undefined
}

export interface H5StyleRecipe {
  
  __type: H5StyleVariantProps
  (props?: H5StyleVariantProps): string
  raw: (props?: H5StyleVariantProps) => H5StyleVariantProps
  variantMap: H5StyleVariantMap
  variantKeys: Array<keyof H5StyleVariant>
  splitVariantProps<Props extends H5StyleVariantProps>(props: Props): [H5StyleVariantProps, Pretty<DistributiveOmit<Props, keyof H5StyleVariantProps>>]
  getVariantProps: (props?: H5StyleVariantProps) => H5StyleVariantProps
}


export declare const h5Style: H5StyleRecipe