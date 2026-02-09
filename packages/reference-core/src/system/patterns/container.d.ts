/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { SystemProperties } from '../types/style-props';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export interface ContainerProperties {
   name?: ConditionalValue<string>
	type?: "inline-size" | "size" | "normal"
	density?: "compact" | "comfortable" | "spacious"
}

interface ContainerStyles extends ContainerProperties, DistributiveOmit<SystemStyleObject, keyof ContainerProperties > {}

interface ContainerPatternFn {
  (styles?: ContainerStyles): string
  raw: (styles?: ContainerStyles) => SystemStyleObject
}


export declare const container: ContainerPatternFn;
