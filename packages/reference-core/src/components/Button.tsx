import { forwardRef } from 'react';
import { css } from '../system/css/index.js';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'medium', className, ...props }, ref) => {
    const buttonClass = css({
      padding: '3r',
      backgroundColor: 'blue.500',
      color: 'white',
      borderRadius: 'md',
      cursor: 'pointer',
      border: 'none',
      _disabled: { opacity: 0.5, cursor: 'not-allowed' },
    });
    return <button ref={ref} className={buttonClass} {...props} />;
  },
);
