/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface KbdStyleVariant {
  
}

type KbdStyleVariantMap = {
  [key in keyof KbdStyleVariant]: Array<KbdStyleVariant[key]>
}



export type KbdStyleVariantProps = {
  [key in keyof KbdStyleVariant]?: ConditionalValue<KbdStyleVariant[key]> | undefined
}

export interface KbdStyleRecipe {
  
  __type: KbdStyleVariantProps
  (props?: KbdStyleVariantProps): string
  raw: (props?: KbdStyleVariantProps) => KbdStyleVariantProps
  variantMap: KbdStyleVariantMap
  variantKeys: Array<keyof KbdStyleVariant>
  splitVariantProps<Props extends KbdStyleVariantProps>(props: Props): [KbdStyleVariantProps, Pretty<DistributiveOmit<Props, keyof KbdStyleVariantProps>>]
  getVariantProps: (props?: KbdStyleVariantProps) => KbdStyleVariantProps
}


export declare const kbdStyle: KbdStyleRecipe