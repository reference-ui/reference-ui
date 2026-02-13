/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface StrongVariant {
  
}

type StrongVariantMap = {
  [key in keyof StrongVariant]: Array<StrongVariant[key]>
}



export type StrongVariantProps = {
  [key in keyof StrongVariant]?: ConditionalValue<StrongVariant[key]> | undefined
}

export interface StrongRecipe {
  
  __type: StrongVariantProps
  (props?: StrongVariantProps): string
  raw: (props?: StrongVariantProps) => StrongVariantProps
  variantMap: StrongVariantMap
  variantKeys: Array<keyof StrongVariant>
  splitVariantProps<Props extends StrongVariantProps>(props: Props): [StrongVariantProps, Pretty<DistributiveOmit<Props, keyof StrongVariantProps>>]
  getVariantProps: (props?: StrongVariantProps) => StrongVariantProps
}


export declare const strong: StrongRecipe