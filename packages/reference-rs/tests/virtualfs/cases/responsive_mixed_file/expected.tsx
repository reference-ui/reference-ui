import { css, cva } from 'src/system/css';

const card = css({
  '@container (min-width: 640px)': { padding: '4' },
  '@container (min-width: 320px)': { padding: '2' },
});

const button = cva({
  base: { '@container (min-width: 480px)': { gap: '3' } },
  defaultVariants: { r: 'keep-me', size: 'sm' },
  compoundVariants: [{ size: 'sm', css: { '@container (min-width: 720px)': { marginTop: '2' } } }],
});

const config = { r: { 900: { padding: '9' } } };