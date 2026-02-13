/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface UStyleVariant {
  
}

type UStyleVariantMap = {
  [key in keyof UStyleVariant]: Array<UStyleVariant[key]>
}



export type UStyleVariantProps = {
  [key in keyof UStyleVariant]?: ConditionalValue<UStyleVariant[key]> | undefined
}

export interface UStyleRecipe {
  
  __type: UStyleVariantProps
  (props?: UStyleVariantProps): string
  raw: (props?: UStyleVariantProps) => UStyleVariantProps
  variantMap: UStyleVariantMap
  variantKeys: Array<keyof UStyleVariant>
  splitVariantProps<Props extends UStyleVariantProps>(props: Props): [UStyleVariantProps, Pretty<DistributiveOmit<Props, keyof UStyleVariantProps>>]
  getVariantProps: (props?: UStyleVariantProps) => UStyleVariantProps
}


export declare const uStyle: UStyleRecipe