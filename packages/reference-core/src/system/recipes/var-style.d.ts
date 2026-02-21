/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface VarStyleVariant {
  
}

type VarStyleVariantMap = {
  [key in keyof VarStyleVariant]: Array<VarStyleVariant[key]>
}



export type VarStyleVariantProps = {
  [key in keyof VarStyleVariant]?: ConditionalValue<VarStyleVariant[key]> | undefined
}

export interface VarStyleRecipe {
  
  __type: VarStyleVariantProps
  (props?: VarStyleVariantProps): string
  raw: (props?: VarStyleVariantProps) => VarStyleVariantProps
  variantMap: VarStyleVariantMap
  variantKeys: Array<keyof VarStyleVariant>
  splitVariantProps<Props extends VarStyleVariantProps>(props: Props): [VarStyleVariantProps, Pretty<DistributiveOmit<Props, keyof VarStyleVariantProps>>]
  getVariantProps: (props?: VarStyleVariantProps) => VarStyleVariantProps
}


export declare const varStyle: VarStyleRecipe