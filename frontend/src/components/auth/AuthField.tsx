'use client';
import { InputHTMLAttributes, ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  trailingLink?: ReactNode;
  children: ReactNode;
}

export function AuthField({ label, htmlFor, hint, error, trailingLink, children }: FieldProps): JSX.Element {
  return (
    <div className="auth-field">
      <div className="auth-field__label-row">
        <label htmlFor={htmlFor} className="auth-field__label">{label}</label>
        {trailingLink}
      </div>
      {children}
      {error
        ? <div className="auth-field__error" role="alert">{error}</div>
        : hint ? <div className="auth-field__hint">{hint}</div> : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  trail?: ReactNode;
  validity?: 'valid' | 'invalid' | null;
}

export function AuthInput({ icon, trail, validity, className, ...rest }: InputProps): JSX.Element {
  return (
    <div className={'auth-input-wrap' + (trail ? ' auth-input-wrap--has-trail' : '')}>
      {icon && <span className="auth-input-icon">{icon}</span>}
      <input
        {...rest}
        className={
          'auth-input'
          + (validity === 'valid' ? ' auth-input--valid' : '')
          + (validity === 'invalid' ? ' auth-input--invalid' : '')
          + (className ? ' ' + className : '')
        }
      />
      {trail && <span className="auth-input-trail">{trail}</span>}
    </div>
  );
}
