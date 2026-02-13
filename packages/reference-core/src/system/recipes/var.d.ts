/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface VarVariant {
  
}

type VarVariantMap = {
  [key in keyof VarVariant]: Array<VarVariant[key]>
}



export type VarVariantProps = {
  [key in keyof VarVariant]?: ConditionalValue<VarVariant[key]> | undefined
}

export interface VarRecipe {
  
  __type: VarVariantProps
  (props?: VarVariantProps): string
  raw: (props?: VarVariantProps) => VarVariantProps
  variantMap: VarVariantMap
  variantKeys: Array<keyof VarVariant>
  splitVariantProps<Props extends VarVariantProps>(props: Props): [VarVariantProps, Pretty<DistributiveOmit<Props, keyof VarVariantProps>>]
  getVariantProps: (props?: VarVariantProps) => VarVariantProps
}


export declare const var: VarRecipe