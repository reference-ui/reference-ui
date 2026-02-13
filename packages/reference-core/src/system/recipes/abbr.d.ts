/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface AbbrVariant {
  
}

type AbbrVariantMap = {
  [key in keyof AbbrVariant]: Array<AbbrVariant[key]>
}



export type AbbrVariantProps = {
  [key in keyof AbbrVariant]?: ConditionalValue<AbbrVariant[key]> | undefined
}

export interface AbbrRecipe {
  
  __type: AbbrVariantProps
  (props?: AbbrVariantProps): string
  raw: (props?: AbbrVariantProps) => AbbrVariantProps
  variantMap: AbbrVariantMap
  variantKeys: Array<keyof AbbrVariant>
  splitVariantProps<Props extends AbbrVariantProps>(props: Props): [AbbrVariantProps, Pretty<DistributiveOmit<Props, keyof AbbrVariantProps>>]
  getVariantProps: (props?: AbbrVariantProps) => AbbrVariantProps
}


export declare const abbr: AbbrRecipe