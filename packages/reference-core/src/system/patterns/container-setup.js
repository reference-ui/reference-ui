import { getPatternStyles, patternFns } from '../helpers.js';
import { css } from '../css/index.js';

const containerSetupConfig = {
transform(props) {
  const { container, ...rest } = props;
  if (container === void 0) return rest;
  return {
    ...rest,
    containerType: "inline-size",
    ...typeof container === "string" && container && { containerName: container }
  };
}}

export const getContainerSetupStyle = (styles = {}) => {
  const _styles = getPatternStyles(containerSetupConfig, styles)
  return containerSetupConfig.transform(_styles, patternFns)
}

export const containerSetup = (styles) => css(getContainerSetupStyle(styles))
containerSetup.raw = getContainerSetupStyle