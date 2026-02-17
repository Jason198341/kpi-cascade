import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-[#090B11] font-semibold hover:bg-primary-hover active:brightness-95',
  secondary: 'bg-surface-light hover:bg-surface-border text-text border border-surface-border hover:border-text-muted/30',
  ghost: 'hover:bg-surface-light text-text-muted hover:text-text',
  danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 hover:border-danger/40',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-150 active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer
        focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
