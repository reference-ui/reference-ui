/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface MarkStyleVariant {
  
}

type MarkStyleVariantMap = {
  [key in keyof MarkStyleVariant]: Array<MarkStyleVariant[key]>
}



export type MarkStyleVariantProps = {
  [key in keyof MarkStyleVariant]?: ConditionalValue<MarkStyleVariant[key]> | undefined
}

export interface MarkStyleRecipe {
  
  __type: MarkStyleVariantProps
  (props?: MarkStyleVariantProps): string
  raw: (props?: MarkStyleVariantProps) => MarkStyleVariantProps
  variantMap: MarkStyleVariantMap
  variantKeys: Array<keyof MarkStyleVariant>
  splitVariantProps<Props extends MarkStyleVariantProps>(props: Props): [MarkStyleVariantProps, Pretty<DistributiveOmit<Props, keyof MarkStyleVariantProps>>]
  getVariantProps: (props?: MarkStyleVariantProps) => MarkStyleVariantProps
}


export declare const markStyle: MarkStyleRecipe