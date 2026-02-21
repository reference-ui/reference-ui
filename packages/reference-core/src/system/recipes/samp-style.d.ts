/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SampStyleVariant {
  
}

type SampStyleVariantMap = {
  [key in keyof SampStyleVariant]: Array<SampStyleVariant[key]>
}



export type SampStyleVariantProps = {
  [key in keyof SampStyleVariant]?: ConditionalValue<SampStyleVariant[key]> | undefined
}

export interface SampStyleRecipe {
  
  __type: SampStyleVariantProps
  (props?: SampStyleVariantProps): string
  raw: (props?: SampStyleVariantProps) => SampStyleVariantProps
  variantMap: SampStyleVariantMap
  variantKeys: Array<keyof SampStyleVariant>
  splitVariantProps<Props extends SampStyleVariantProps>(props: Props): [SampStyleVariantProps, Pretty<DistributiveOmit<Props, keyof SampStyleVariantProps>>]
  getVariantProps: (props?: SampStyleVariantProps) => SampStyleVariantProps
}


export declare const sampStyle: SampStyleRecipe