/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface H6Variant {
  
}

type H6VariantMap = {
  [key in keyof H6Variant]: Array<H6Variant[key]>
}



export type H6VariantProps = {
  [key in keyof H6Variant]?: ConditionalValue<H6Variant[key]> | undefined
}

export interface H6Recipe {
  
  __type: H6VariantProps
  (props?: H6VariantProps): string
  raw: (props?: H6VariantProps) => H6VariantProps
  variantMap: H6VariantMap
  variantKeys: Array<keyof H6Variant>
  splitVariantProps<Props extends H6VariantProps>(props: Props): [H6VariantProps, Pretty<DistributiveOmit<Props, keyof H6VariantProps>>]
  getVariantProps: (props?: H6VariantProps) => H6VariantProps
}


export declare const h6: H6Recipe