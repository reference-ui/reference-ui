/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface PreVariant {
  
}

type PreVariantMap = {
  [key in keyof PreVariant]: Array<PreVariant[key]>
}



export type PreVariantProps = {
  [key in keyof PreVariant]?: ConditionalValue<PreVariant[key]> | undefined
}

export interface PreRecipe {
  
  __type: PreVariantProps
  (props?: PreVariantProps): string
  raw: (props?: PreVariantProps) => PreVariantProps
  variantMap: PreVariantMap
  variantKeys: Array<keyof PreVariant>
  splitVariantProps<Props extends PreVariantProps>(props: Props): [PreVariantProps, Pretty<DistributiveOmit<Props, keyof PreVariantProps>>]
  getVariantProps: (props?: PreVariantProps) => PreVariantProps
}


export declare const pre: PreRecipe