import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', id, ...rest }: Props) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-text-muted">{label}</label>
      )}
      <input
        id={inputId}
        className={`bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text
          placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors ${className}`}
        {...rest}
      />
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className = '', ...rest }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-text-muted">{label}</label>}
      <textarea
        className={`bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text
          placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors
          resize-none ${className}`}
        {...rest}
      />
    </div>
  )
}
