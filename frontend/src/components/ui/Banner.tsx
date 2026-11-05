import type { ReactNode } from 'react';

interface BannerProps {
  tone: 'info' | 'warning' | 'error';
  children: ReactNode;
  action?: ReactNode;
}

const TONES = {
  info: 'border-border text-text',
  warning: 'border-status-maintenance text-status-maintenance',
  error: 'border-danger text-danger',
};

export function Banner({ tone, children, action }: BannerProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-center justify-between gap-3 rounded-lg border bg-surface px-4 py-3 text-sm shadow-md ${TONES[tone]}`}
    >
      <span>{children}</span>
      {action}
    </div>
  );
}
