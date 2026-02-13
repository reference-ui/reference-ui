/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface H5Variant {
  
}

type H5VariantMap = {
  [key in keyof H5Variant]: Array<H5Variant[key]>
}



export type H5VariantProps = {
  [key in keyof H5Variant]?: ConditionalValue<H5Variant[key]> | undefined
}

export interface H5Recipe {
  
  __type: H5VariantProps
  (props?: H5VariantProps): string
  raw: (props?: H5VariantProps) => H5VariantProps
  variantMap: H5VariantMap
  variantKeys: Array<keyof H5Variant>
  splitVariantProps<Props extends H5VariantProps>(props: Props): [H5VariantProps, Pretty<DistributiveOmit<Props, keyof H5VariantProps>>]
  getVariantProps: (props?: H5VariantProps) => H5VariantProps
}


export declare const h5: H5Recipe