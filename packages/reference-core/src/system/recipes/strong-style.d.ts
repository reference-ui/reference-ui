/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface StrongStyleVariant {
  
}

type StrongStyleVariantMap = {
  [key in keyof StrongStyleVariant]: Array<StrongStyleVariant[key]>
}



export type StrongStyleVariantProps = {
  [key in keyof StrongStyleVariant]?: ConditionalValue<StrongStyleVariant[key]> | undefined
}

export interface StrongStyleRecipe {
  
  __type: StrongStyleVariantProps
  (props?: StrongStyleVariantProps): string
  raw: (props?: StrongStyleVariantProps) => StrongStyleVariantProps
  variantMap: StrongStyleVariantMap
  variantKeys: Array<keyof StrongStyleVariant>
  splitVariantProps<Props extends StrongStyleVariantProps>(props: Props): [StrongStyleVariantProps, Pretty<DistributiveOmit<Props, keyof StrongStyleVariantProps>>]
  getVariantProps: (props?: StrongStyleVariantProps) => StrongStyleVariantProps
}


export declare const strongStyle: StrongStyleRecipe