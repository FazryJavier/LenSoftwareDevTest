import type { ComponentProps } from 'react';

const VARIANTS = {
  primary: 'bg-primary text-surface',
  secondary: 'border border-border bg-surface text-text',
  danger: 'bg-danger text-surface',
};

interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof VARIANTS;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    />
  );
}
