import { css, cva } from 'src/system/css';

const card = css({
  '@container (min-width: 640px)': { padding: '4' },
  r: { 320: { padding: '2' } },
});

const button = cva({
  base: { r: { 480: { gap: '3' } } },
  defaultVariants: { r: 'keep-me', size: 'sm' },
  compoundVariants: [{ size: 'sm', css: { r: { 720: { marginTop: '2' } } } }],
});

const config = { r: { 900: { padding: '9' } } };