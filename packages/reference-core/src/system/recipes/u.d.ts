/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface UVariant {
  
}

type UVariantMap = {
  [key in keyof UVariant]: Array<UVariant[key]>
}



export type UVariantProps = {
  [key in keyof UVariant]?: ConditionalValue<UVariant[key]> | undefined
}

export interface URecipe {
  
  __type: UVariantProps
  (props?: UVariantProps): string
  raw: (props?: UVariantProps) => UVariantProps
  variantMap: UVariantMap
  variantKeys: Array<keyof UVariant>
  splitVariantProps<Props extends UVariantProps>(props: Props): [UVariantProps, Pretty<DistributiveOmit<Props, keyof UVariantProps>>]
  getVariantProps: (props?: UVariantProps) => UVariantProps
}


export declare const u: URecipe