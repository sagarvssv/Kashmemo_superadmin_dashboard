import { type ReactNode } from 'react'
import clsx from 'clsx'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="font-display text-sm font-semibold text-ink-800">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-[#d03b3b]">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-400">{hint}</p>
      ) : null}
    </div>
  )
}

const baseControl =
  'w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink-900 placeholder:text-ink-400 outline-none transition-colors duration-150 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export function controlClasses(hasError?: boolean) {
  return clsx(baseControl, hasError ? 'border-[#d03b3b]' : 'border-ink-200')
}
