/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface BVariant {
  
}

type BVariantMap = {
  [key in keyof BVariant]: Array<BVariant[key]>
}



export type BVariantProps = {
  [key in keyof BVariant]?: ConditionalValue<BVariant[key]> | undefined
}

export interface BRecipe {
  
  __type: BVariantProps
  (props?: BVariantProps): string
  raw: (props?: BVariantProps) => BVariantProps
  variantMap: BVariantMap
  variantKeys: Array<keyof BVariant>
  splitVariantProps<Props extends BVariantProps>(props: Props): [BVariantProps, Pretty<DistributiveOmit<Props, keyof BVariantProps>>]
  getVariantProps: (props?: BVariantProps) => BVariantProps
}


export declare const b: BRecipe