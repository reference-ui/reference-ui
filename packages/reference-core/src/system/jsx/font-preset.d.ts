/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { FontPresetProperties } from '../patterns/font-preset';
import type { HTMLStyledProps } from '../types/jsx';
import type { DistributiveOmit } from '../types/system-types';

export interface FontPresetProps extends FontPresetProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof FontPresetProperties | 'font'> {}


export declare const FontPreset: FunctionComponent<FontPresetProps>