/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface QVariant {
  
}

type QVariantMap = {
  [key in keyof QVariant]: Array<QVariant[key]>
}



export type QVariantProps = {
  [key in keyof QVariant]?: ConditionalValue<QVariant[key]> | undefined
}

export interface QRecipe {
  
  __type: QVariantProps
  (props?: QVariantProps): string
  raw: (props?: QVariantProps) => QVariantProps
  variantMap: QVariantMap
  variantKeys: Array<keyof QVariant>
  splitVariantProps<Props extends QVariantProps>(props: Props): [QVariantProps, Pretty<DistributiveOmit<Props, keyof QVariantProps>>]
  getVariantProps: (props?: QVariantProps) => QVariantProps
}


export declare const q: QRecipe