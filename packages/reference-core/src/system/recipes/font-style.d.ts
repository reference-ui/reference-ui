/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface FontStyleVariant {
  font: "sans" | "serif" | "mono"
}

type FontStyleVariantMap = {
  [key in keyof FontStyleVariant]: Array<FontStyleVariant[key]>
}



export type FontStyleVariantProps = {
  [key in keyof FontStyleVariant]?: ConditionalValue<FontStyleVariant[key]> | undefined
}

export interface FontStyleRecipe {
  
  __type: FontStyleVariantProps
  (props?: FontStyleVariantProps): string
  raw: (props?: FontStyleVariantProps) => FontStyleVariantProps
  variantMap: FontStyleVariantMap
  variantKeys: Array<keyof FontStyleVariant>
  splitVariantProps<Props extends FontStyleVariantProps>(props: Props): [FontStyleVariantProps, Pretty<DistributiveOmit<Props, keyof FontStyleVariantProps>>]
  getVariantProps: (props?: FontStyleVariantProps) => FontStyleVariantProps
}


export declare const fontStyle: FontStyleRecipe