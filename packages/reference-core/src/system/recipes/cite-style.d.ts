/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface CiteStyleVariant {
  
}

type CiteStyleVariantMap = {
  [key in keyof CiteStyleVariant]: Array<CiteStyleVariant[key]>
}



export type CiteStyleVariantProps = {
  [key in keyof CiteStyleVariant]?: ConditionalValue<CiteStyleVariant[key]> | undefined
}

export interface CiteStyleRecipe {
  
  __type: CiteStyleVariantProps
  (props?: CiteStyleVariantProps): string
  raw: (props?: CiteStyleVariantProps) => CiteStyleVariantProps
  variantMap: CiteStyleVariantMap
  variantKeys: Array<keyof CiteStyleVariant>
  splitVariantProps<Props extends CiteStyleVariantProps>(props: Props): [CiteStyleVariantProps, Pretty<DistributiveOmit<Props, keyof CiteStyleVariantProps>>]
  getVariantProps: (props?: CiteStyleVariantProps) => CiteStyleVariantProps
}


export declare const citeStyle: CiteStyleRecipe