/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface EmVariant {
  
}

type EmVariantMap = {
  [key in keyof EmVariant]: Array<EmVariant[key]>
}



export type EmVariantProps = {
  [key in keyof EmVariant]?: ConditionalValue<EmVariant[key]> | undefined
}

export interface EmRecipe {
  
  __type: EmVariantProps
  (props?: EmVariantProps): string
  raw: (props?: EmVariantProps) => EmVariantProps
  variantMap: EmVariantMap
  variantKeys: Array<keyof EmVariant>
  splitVariantProps<Props extends EmVariantProps>(props: Props): [EmVariantProps, Pretty<DistributiveOmit<Props, keyof EmVariantProps>>]
  getVariantProps: (props?: EmVariantProps) => EmVariantProps
}


export declare const em: EmRecipe