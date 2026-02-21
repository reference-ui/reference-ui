/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface EmStyleVariant {
  
}

type EmStyleVariantMap = {
  [key in keyof EmStyleVariant]: Array<EmStyleVariant[key]>
}



export type EmStyleVariantProps = {
  [key in keyof EmStyleVariant]?: ConditionalValue<EmStyleVariant[key]> | undefined
}

export interface EmStyleRecipe {
  
  __type: EmStyleVariantProps
  (props?: EmStyleVariantProps): string
  raw: (props?: EmStyleVariantProps) => EmStyleVariantProps
  variantMap: EmStyleVariantMap
  variantKeys: Array<keyof EmStyleVariant>
  splitVariantProps<Props extends EmStyleVariantProps>(props: Props): [EmStyleVariantProps, Pretty<DistributiveOmit<Props, keyof EmStyleVariantProps>>]
  getVariantProps: (props?: EmStyleVariantProps) => EmStyleVariantProps
}


export declare const emStyle: EmStyleRecipe