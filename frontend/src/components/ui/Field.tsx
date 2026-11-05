import type { ComponentProps, ReactNode } from 'react';

const CONTROL_CLASS =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none aria-invalid:border-danger';

interface ControlState {
  error?: string | undefined;
}

function controlProps(id: string | undefined, error: string | undefined) {
  return {
    'aria-invalid': error !== undefined,
    'aria-describedby': error !== undefined && id !== undefined ? `${id}-error` : undefined,
  };
}

export function TextInput({ error, ...props }: ComponentProps<'input'> & ControlState) {
  return <input {...props} {...controlProps(props.id, error)} className={CONTROL_CLASS} />;
}

export function TextArea({ error, ...props }: ComponentProps<'textarea'> & ControlState) {
  return <textarea {...props} {...controlProps(props.id, error)} className={CONTROL_CLASS} />;
}

export function Select({ error, ...props }: ComponentProps<'select'> & ControlState) {
  return <select {...props} {...controlProps(props.id, error)} className={CONTROL_CLASS} />;
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string | undefined;
  children: ReactNode;
}

export function Field({ id, label, required = false, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-text-muted">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error !== undefined && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
