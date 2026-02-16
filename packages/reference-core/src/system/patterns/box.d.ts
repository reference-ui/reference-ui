/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { SystemProperties } from '../types/style-props';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export interface BoxProperties {
   container?: ConditionalValue<string>
	font?: ConditionalValue<string>
	r?: ConditionalValue<object>
}

interface BoxStyles extends BoxProperties, DistributiveOmit<SystemStyleObject, keyof BoxProperties | 'container' | 'font' | 'r'> {}

interface BoxPatternFn {
  (styles?: BoxStyles): string
  raw: (styles?: BoxStyles) => SystemStyleObject
}


export declare const box: BoxPatternFn;
