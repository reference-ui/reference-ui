/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface CodeStyleVariant {
  
}

type CodeStyleVariantMap = {
  [key in keyof CodeStyleVariant]: Array<CodeStyleVariant[key]>
}



export type CodeStyleVariantProps = {
  [key in keyof CodeStyleVariant]?: ConditionalValue<CodeStyleVariant[key]> | undefined
}

export interface CodeStyleRecipe {
  
  __type: CodeStyleVariantProps
  (props?: CodeStyleVariantProps): string
  raw: (props?: CodeStyleVariantProps) => CodeStyleVariantProps
  variantMap: CodeStyleVariantMap
  variantKeys: Array<keyof CodeStyleVariant>
  splitVariantProps<Props extends CodeStyleVariantProps>(props: Props): [CodeStyleVariantProps, Pretty<DistributiveOmit<Props, keyof CodeStyleVariantProps>>]
  getVariantProps: (props?: CodeStyleVariantProps) => CodeStyleVariantProps
}


export declare const codeStyle: CodeStyleRecipe