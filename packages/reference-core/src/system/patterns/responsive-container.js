import { getPatternStyles, patternFns } from '../helpers.js';
import { css } from '../css/index.js';

const responsiveContainerConfig = {
transform(props) {
  const { r, container, ...rest } = props;
  if (!r) return rest;
  const prefix = container ? `@container ${container} (min-width:` : `@container (min-width:`;
  return {
    ...rest,
    ...Object.fromEntries(
      Object.entries(r).map(([bp, styles]) => [`${prefix} ${bp}px)`, styles])
    )
  };
}}

export const getResponsiveContainerStyle = (styles = {}) => {
  const _styles = getPatternStyles(responsiveContainerConfig, styles)
  return responsiveContainerConfig.transform(_styles, patternFns)
}

export const responsiveContainer = (styles) => css(getResponsiveContainerStyle(styles))
responsiveContainer.raw = getResponsiveContainerStyle