/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SubVariant {
  
}

type SubVariantMap = {
  [key in keyof SubVariant]: Array<SubVariant[key]>
}



export type SubVariantProps = {
  [key in keyof SubVariant]?: ConditionalValue<SubVariant[key]> | undefined
}

export interface SubRecipe {
  
  __type: SubVariantProps
  (props?: SubVariantProps): string
  raw: (props?: SubVariantProps) => SubVariantProps
  variantMap: SubVariantMap
  variantKeys: Array<keyof SubVariant>
  splitVariantProps<Props extends SubVariantProps>(props: Props): [SubVariantProps, Pretty<DistributiveOmit<Props, keyof SubVariantProps>>]
  getVariantProps: (props?: SubVariantProps) => SubVariantProps
}


export declare const sub: SubRecipe