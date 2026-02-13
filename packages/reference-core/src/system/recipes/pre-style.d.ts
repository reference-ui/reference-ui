/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface PreStyleVariant {
  
}

type PreStyleVariantMap = {
  [key in keyof PreStyleVariant]: Array<PreStyleVariant[key]>
}



export type PreStyleVariantProps = {
  [key in keyof PreStyleVariant]?: ConditionalValue<PreStyleVariant[key]> | undefined
}

export interface PreStyleRecipe {
  
  __type: PreStyleVariantProps
  (props?: PreStyleVariantProps): string
  raw: (props?: PreStyleVariantProps) => PreStyleVariantProps
  variantMap: PreStyleVariantMap
  variantKeys: Array<keyof PreStyleVariant>
  splitVariantProps<Props extends PreStyleVariantProps>(props: Props): [PreStyleVariantProps, Pretty<DistributiveOmit<Props, keyof PreStyleVariantProps>>]
  getVariantProps: (props?: PreStyleVariantProps) => PreStyleVariantProps
}


export declare const preStyle: PreStyleRecipe