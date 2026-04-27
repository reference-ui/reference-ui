import { cva } from 'src/system/css';

const card = cva({
  base: {
    '@container (min-width: 480px)': { padding: '4' },
  },
});