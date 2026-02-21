/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SStyleVariant {
  
}

type SStyleVariantMap = {
  [key in keyof SStyleVariant]: Array<SStyleVariant[key]>
}



export type SStyleVariantProps = {
  [key in keyof SStyleVariant]?: ConditionalValue<SStyleVariant[key]> | undefined
}

export interface SStyleRecipe {
  
  __type: SStyleVariantProps
  (props?: SStyleVariantProps): string
  raw: (props?: SStyleVariantProps) => SStyleVariantProps
  variantMap: SStyleVariantMap
  variantKeys: Array<keyof SStyleVariant>
  splitVariantProps<Props extends SStyleVariantProps>(props: Props): [SStyleVariantProps, Pretty<DistributiveOmit<Props, keyof SStyleVariantProps>>]
  getVariantProps: (props?: SStyleVariantProps) => SStyleVariantProps
}


export declare const sStyle: SStyleRecipe