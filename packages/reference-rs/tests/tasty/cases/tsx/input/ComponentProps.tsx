/**
 * TSX scenario: ensure .tsx files are scanned and interfaces/types are extracted.
 * JSX in the file is irrelevant for the type scanner; we only care about exported types.
 */

/** Props for a React-like button component (type-only; no JSX usage required). */
export interface ButtonProps {
  /** Button label. */
  label: string;
  /** Optional click handler. */
  onClick?: () => void;
  /** Optional disabled state. */
  disabled?: boolean;
}

/** Variant type used by ButtonProps. */
export type ButtonVariant = 'default' | 'primary' | 'danger';
