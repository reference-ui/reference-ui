/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SampVariant {
  
}

type SampVariantMap = {
  [key in keyof SampVariant]: Array<SampVariant[key]>
}



export type SampVariantProps = {
  [key in keyof SampVariant]?: ConditionalValue<SampVariant[key]> | undefined
}

export interface SampRecipe {
  
  __type: SampVariantProps
  (props?: SampVariantProps): string
  raw: (props?: SampVariantProps) => SampVariantProps
  variantMap: SampVariantMap
  variantKeys: Array<keyof SampVariant>
  splitVariantProps<Props extends SampVariantProps>(props: Props): [SampVariantProps, Pretty<DistributiveOmit<Props, keyof SampVariantProps>>]
  getVariantProps: (props?: SampVariantProps) => SampVariantProps
}


export declare const samp: SampRecipe