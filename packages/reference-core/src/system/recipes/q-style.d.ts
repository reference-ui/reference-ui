/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface QStyleVariant {
  
}

type QStyleVariantMap = {
  [key in keyof QStyleVariant]: Array<QStyleVariant[key]>
}



export type QStyleVariantProps = {
  [key in keyof QStyleVariant]?: ConditionalValue<QStyleVariant[key]> | undefined
}

export interface QStyleRecipe {
  
  __type: QStyleVariantProps
  (props?: QStyleVariantProps): string
  raw: (props?: QStyleVariantProps) => QStyleVariantProps
  variantMap: QStyleVariantMap
  variantKeys: Array<keyof QStyleVariant>
  splitVariantProps<Props extends QStyleVariantProps>(props: Props): [QStyleVariantProps, Pretty<DistributiveOmit<Props, keyof QStyleVariantProps>>]
  getVariantProps: (props?: QStyleVariantProps) => QStyleVariantProps
}


export declare const qStyle: QStyleRecipe