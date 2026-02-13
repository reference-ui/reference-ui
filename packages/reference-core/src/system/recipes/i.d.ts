/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface IVariant {
  
}

type IVariantMap = {
  [key in keyof IVariant]: Array<IVariant[key]>
}



export type IVariantProps = {
  [key in keyof IVariant]?: ConditionalValue<IVariant[key]> | undefined
}

export interface IRecipe {
  
  __type: IVariantProps
  (props?: IVariantProps): string
  raw: (props?: IVariantProps) => IVariantProps
  variantMap: IVariantMap
  variantKeys: Array<keyof IVariant>
  splitVariantProps<Props extends IVariantProps>(props: Props): [IVariantProps, Pretty<DistributiveOmit<Props, keyof IVariantProps>>]
  getVariantProps: (props?: IVariantProps) => IVariantProps
}


export declare const i: IRecipe