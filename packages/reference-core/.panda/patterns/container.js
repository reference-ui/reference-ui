import { getPatternStyles, patternFns } from '../helpers.js';
import { css } from '../css/index.js';

const containerConfig = {
transform(props) {
  const { name, type, density, ...rest } = props;
  return {
    containerType: type,
    ...name && { containerName: name },
    ...density && { "data-density": density },
    ...rest
  };
},
defaultValues:{type:'inline-size'}}

export const getContainerStyle = (styles = {}) => {
  const _styles = getPatternStyles(containerConfig, styles)
  return containerConfig.transform(_styles, patternFns)
}

export const container = (styles) => css(getContainerStyle(styles))
container.raw = getContainerStyle