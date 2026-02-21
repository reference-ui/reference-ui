/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface AbbrStyleVariant {
  
}

type AbbrStyleVariantMap = {
  [key in keyof AbbrStyleVariant]: Array<AbbrStyleVariant[key]>
}



export type AbbrStyleVariantProps = {
  [key in keyof AbbrStyleVariant]?: ConditionalValue<AbbrStyleVariant[key]> | undefined
}

export interface AbbrStyleRecipe {
  
  __type: AbbrStyleVariantProps
  (props?: AbbrStyleVariantProps): string
  raw: (props?: AbbrStyleVariantProps) => AbbrStyleVariantProps
  variantMap: AbbrStyleVariantMap
  variantKeys: Array<keyof AbbrStyleVariant>
  splitVariantProps<Props extends AbbrStyleVariantProps>(props: Props): [AbbrStyleVariantProps, Pretty<DistributiveOmit<Props, keyof AbbrStyleVariantProps>>]
  getVariantProps: (props?: AbbrStyleVariantProps) => AbbrStyleVariantProps
}


export declare const abbrStyle: AbbrStyleRecipe