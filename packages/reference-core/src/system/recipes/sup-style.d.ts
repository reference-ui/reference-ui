/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SupStyleVariant {
  
}

type SupStyleVariantMap = {
  [key in keyof SupStyleVariant]: Array<SupStyleVariant[key]>
}



export type SupStyleVariantProps = {
  [key in keyof SupStyleVariant]?: ConditionalValue<SupStyleVariant[key]> | undefined
}

export interface SupStyleRecipe {
  
  __type: SupStyleVariantProps
  (props?: SupStyleVariantProps): string
  raw: (props?: SupStyleVariantProps) => SupStyleVariantProps
  variantMap: SupStyleVariantMap
  variantKeys: Array<keyof SupStyleVariant>
  splitVariantProps<Props extends SupStyleVariantProps>(props: Props): [SupStyleVariantProps, Pretty<DistributiveOmit<Props, keyof SupStyleVariantProps>>]
  getVariantProps: (props?: SupStyleVariantProps) => SupStyleVariantProps
}


export declare const supStyle: SupStyleRecipe