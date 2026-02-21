/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface IStyleVariant {
  
}

type IStyleVariantMap = {
  [key in keyof IStyleVariant]: Array<IStyleVariant[key]>
}



export type IStyleVariantProps = {
  [key in keyof IStyleVariant]?: ConditionalValue<IStyleVariant[key]> | undefined
}

export interface IStyleRecipe {
  
  __type: IStyleVariantProps
  (props?: IStyleVariantProps): string
  raw: (props?: IStyleVariantProps) => IStyleVariantProps
  variantMap: IStyleVariantMap
  variantKeys: Array<keyof IStyleVariant>
  splitVariantProps<Props extends IStyleVariantProps>(props: Props): [IStyleVariantProps, Pretty<DistributiveOmit<Props, keyof IStyleVariantProps>>]
  getVariantProps: (props?: IStyleVariantProps) => IStyleVariantProps
}


export declare const iStyle: IStyleRecipe