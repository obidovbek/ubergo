/**
 * Button Component
 * Reusable button with variants
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'text' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: ReactNode;
  loading?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'medium',
  children,
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

