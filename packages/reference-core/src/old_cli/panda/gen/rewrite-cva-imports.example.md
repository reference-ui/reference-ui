# Recipe Import Rewriting Examples

The `rewriteCvaImports` function transforms imports and usages of `recipe` from `@reference-ui/core` to use `cva` from the local styled-system.

## Example 1: Basic recipe import

### Before (User Code):
```tsx
import { Div, recipe } from '@reference-ui/core';

const buttonRecipe = recipe({
  base: { px: '4', py: '2' },
  variants: {
    variant: { primary: { bg: 'blue.500' } }
  }
});
```

### After (Transformed):
```tsx
import { cva } from '../src/system/css';
import { Div } from '@reference-ui/core';

const buttonRecipe = cva({
  base: { px: '4', py: '2' },
  variants: {
    variant: { primary: { bg: 'blue.500' } }
  }
});
```

## Example 2: Using cva directly (still works)

### Before (User Code):
```tsx
import { Div, cva } from '@reference-ui/core';

const buttonRecipe = cva({
  base: { px: '4', py: '2' }
});
```

### After (Transformed):
```tsx
import { cva } from '../src/system/css';
import { Div } from '@reference-ui/core';

const buttonRecipe = cva({
  base: { px: '4', py: '2' }
});
```

## Example 3: Aliased import

### Before (User Code):
```tsx
import { recipe as myRecipe } from '@reference-ui/core';

const button = myRecipe({ base: { px: '4' } });
```

### After (Transformed):
```tsx
import { cva } from '../src/system/css';

const button = cva({ base: { px: '4' } });
```

## Key Features

1. **Import Splitting**: Separates `cva`/`recipe` import from other `@reference-ui/core` imports
2. **Local Name Tracking**: Handles aliased imports correctly
3. **Usage Replacement**: Replaces all `recipe(` calls with `cva(` in the code
4. **Byte-for-byte Preservation**: Only modifies imports and function names, preserving everything else exactly
