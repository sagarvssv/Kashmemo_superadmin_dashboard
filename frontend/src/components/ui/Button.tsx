import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-soft hover:shadow-[var(--shadow-glow)] hover:from-brand-500 hover:to-brand-600 active:to-brand-800 disabled:bg-ink-300 disabled:from-ink-300 disabled:to-ink-300 disabled:shadow-none',
  secondary:
    'bg-white text-ink-800 border border-ink-200 hover:border-brand-200 hover:bg-ink-50 disabled:text-ink-300',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-50 disabled:text-ink-300',
  danger: 'bg-[#d03b3b] text-white shadow-soft hover:bg-[#b93333] active:bg-[#9c2b2b] disabled:bg-ink-300',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading, fullWidth, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display text-[15px] font-semibold transition-all duration-200 disabled:cursor-not-allowed',
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
})
