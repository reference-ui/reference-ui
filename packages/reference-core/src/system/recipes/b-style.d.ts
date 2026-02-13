/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface BStyleVariant {
  
}

type BStyleVariantMap = {
  [key in keyof BStyleVariant]: Array<BStyleVariant[key]>
}



export type BStyleVariantProps = {
  [key in keyof BStyleVariant]?: ConditionalValue<BStyleVariant[key]> | undefined
}

export interface BStyleRecipe {
  
  __type: BStyleVariantProps
  (props?: BStyleVariantProps): string
  raw: (props?: BStyleVariantProps) => BStyleVariantProps
  variantMap: BStyleVariantMap
  variantKeys: Array<keyof BStyleVariant>
  splitVariantProps<Props extends BStyleVariantProps>(props: Props): [BStyleVariantProps, Pretty<DistributiveOmit<Props, keyof BStyleVariantProps>>]
  getVariantProps: (props?: BStyleVariantProps) => BStyleVariantProps
}


export declare const bStyle: BStyleRecipe