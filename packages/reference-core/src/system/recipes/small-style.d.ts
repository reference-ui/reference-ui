/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SmallStyleVariant {
  
}

type SmallStyleVariantMap = {
  [key in keyof SmallStyleVariant]: Array<SmallStyleVariant[key]>
}



export type SmallStyleVariantProps = {
  [key in keyof SmallStyleVariant]?: ConditionalValue<SmallStyleVariant[key]> | undefined
}

export interface SmallStyleRecipe {
  
  __type: SmallStyleVariantProps
  (props?: SmallStyleVariantProps): string
  raw: (props?: SmallStyleVariantProps) => SmallStyleVariantProps
  variantMap: SmallStyleVariantMap
  variantKeys: Array<keyof SmallStyleVariant>
  splitVariantProps<Props extends SmallStyleVariantProps>(props: Props): [SmallStyleVariantProps, Pretty<DistributiveOmit<Props, keyof SmallStyleVariantProps>>]
  getVariantProps: (props?: SmallStyleVariantProps) => SmallStyleVariantProps
}


export declare const smallStyle: SmallStyleRecipe