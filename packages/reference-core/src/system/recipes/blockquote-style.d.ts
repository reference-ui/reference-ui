/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface BlockquoteStyleVariant {
  
}

type BlockquoteStyleVariantMap = {
  [key in keyof BlockquoteStyleVariant]: Array<BlockquoteStyleVariant[key]>
}



export type BlockquoteStyleVariantProps = {
  [key in keyof BlockquoteStyleVariant]?: ConditionalValue<BlockquoteStyleVariant[key]> | undefined
}

export interface BlockquoteStyleRecipe {
  
  __type: BlockquoteStyleVariantProps
  (props?: BlockquoteStyleVariantProps): string
  raw: (props?: BlockquoteStyleVariantProps) => BlockquoteStyleVariantProps
  variantMap: BlockquoteStyleVariantMap
  variantKeys: Array<keyof BlockquoteStyleVariant>
  splitVariantProps<Props extends BlockquoteStyleVariantProps>(props: Props): [BlockquoteStyleVariantProps, Pretty<DistributiveOmit<Props, keyof BlockquoteStyleVariantProps>>]
  getVariantProps: (props?: BlockquoteStyleVariantProps) => BlockquoteStyleVariantProps
}


export declare const blockquoteStyle: BlockquoteStyleRecipe