/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SupVariant {
  
}

type SupVariantMap = {
  [key in keyof SupVariant]: Array<SupVariant[key]>
}



export type SupVariantProps = {
  [key in keyof SupVariant]?: ConditionalValue<SupVariant[key]> | undefined
}

export interface SupRecipe {
  
  __type: SupVariantProps
  (props?: SupVariantProps): string
  raw: (props?: SupVariantProps) => SupVariantProps
  variantMap: SupVariantMap
  variantKeys: Array<keyof SupVariant>
  splitVariantProps<Props extends SupVariantProps>(props: Props): [SupVariantProps, Pretty<DistributiveOmit<Props, keyof SupVariantProps>>]
  getVariantProps: (props?: SupVariantProps) => SupVariantProps
}


export declare const sup: SupRecipe