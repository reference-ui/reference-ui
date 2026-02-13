/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SVariant {
  
}

type SVariantMap = {
  [key in keyof SVariant]: Array<SVariant[key]>
}



export type SVariantProps = {
  [key in keyof SVariant]?: ConditionalValue<SVariant[key]> | undefined
}

export interface SRecipe {
  
  __type: SVariantProps
  (props?: SVariantProps): string
  raw: (props?: SVariantProps) => SVariantProps
  variantMap: SVariantMap
  variantKeys: Array<keyof SVariant>
  splitVariantProps<Props extends SVariantProps>(props: Props): [SVariantProps, Pretty<DistributiveOmit<Props, keyof SVariantProps>>]
  getVariantProps: (props?: SVariantProps) => SVariantProps
}


export declare const s: SRecipe