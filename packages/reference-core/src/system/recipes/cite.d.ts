/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface CiteVariant {
  
}

type CiteVariantMap = {
  [key in keyof CiteVariant]: Array<CiteVariant[key]>
}



export type CiteVariantProps = {
  [key in keyof CiteVariant]?: ConditionalValue<CiteVariant[key]> | undefined
}

export interface CiteRecipe {
  
  __type: CiteVariantProps
  (props?: CiteVariantProps): string
  raw: (props?: CiteVariantProps) => CiteVariantProps
  variantMap: CiteVariantMap
  variantKeys: Array<keyof CiteVariant>
  splitVariantProps<Props extends CiteVariantProps>(props: Props): [CiteVariantProps, Pretty<DistributiveOmit<Props, keyof CiteVariantProps>>]
  getVariantProps: (props?: CiteVariantProps) => CiteVariantProps
}


export declare const cite: CiteRecipe