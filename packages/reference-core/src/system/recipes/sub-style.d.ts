/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SubStyleVariant {
  
}

type SubStyleVariantMap = {
  [key in keyof SubStyleVariant]: Array<SubStyleVariant[key]>
}



export type SubStyleVariantProps = {
  [key in keyof SubStyleVariant]?: ConditionalValue<SubStyleVariant[key]> | undefined
}

export interface SubStyleRecipe {
  
  __type: SubStyleVariantProps
  (props?: SubStyleVariantProps): string
  raw: (props?: SubStyleVariantProps) => SubStyleVariantProps
  variantMap: SubStyleVariantMap
  variantKeys: Array<keyof SubStyleVariant>
  splitVariantProps<Props extends SubStyleVariantProps>(props: Props): [SubStyleVariantProps, Pretty<DistributiveOmit<Props, keyof SubStyleVariantProps>>]
  getVariantProps: (props?: SubStyleVariantProps) => SubStyleVariantProps
}


export declare const subStyle: SubStyleRecipe