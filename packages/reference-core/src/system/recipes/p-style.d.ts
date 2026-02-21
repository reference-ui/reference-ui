/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface PStyleVariant {
  
}

type PStyleVariantMap = {
  [key in keyof PStyleVariant]: Array<PStyleVariant[key]>
}



export type PStyleVariantProps = {
  [key in keyof PStyleVariant]?: ConditionalValue<PStyleVariant[key]> | undefined
}

export interface PStyleRecipe {
  
  __type: PStyleVariantProps
  (props?: PStyleVariantProps): string
  raw: (props?: PStyleVariantProps) => PStyleVariantProps
  variantMap: PStyleVariantMap
  variantKeys: Array<keyof PStyleVariant>
  splitVariantProps<Props extends PStyleVariantProps>(props: Props): [PStyleVariantProps, Pretty<DistributiveOmit<Props, keyof PStyleVariantProps>>]
  getVariantProps: (props?: PStyleVariantProps) => PStyleVariantProps
}


export declare const pStyle: PStyleRecipe