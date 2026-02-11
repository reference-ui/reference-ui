/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface PrimitiveCSSVariant {
  
}

type PrimitiveCSSVariantMap = {
  [key in keyof PrimitiveCSSVariant]: Array<PrimitiveCSSVariant[key]>
}



export type PrimitiveCSSVariantProps = {
  [key in keyof PrimitiveCSSVariant]?: ConditionalValue<PrimitiveCSSVariant[key]> | undefined
}

export interface PrimitiveCSSRecipe {
  
  __type: PrimitiveCSSVariantProps
  (props?: PrimitiveCSSVariantProps): string
  raw: (props?: PrimitiveCSSVariantProps) => PrimitiveCSSVariantProps
  variantMap: PrimitiveCSSVariantMap
  variantKeys: Array<keyof PrimitiveCSSVariant>
  splitVariantProps<Props extends PrimitiveCSSVariantProps>(props: Props): [PrimitiveCSSVariantProps, Pretty<DistributiveOmit<Props, keyof PrimitiveCSSVariantProps>>]
  getVariantProps: (props?: PrimitiveCSSVariantProps) => PrimitiveCSSVariantProps
}


export declare const primitiveCSS: PrimitiveCSSRecipe