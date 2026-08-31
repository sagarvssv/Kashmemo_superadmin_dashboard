import { type HTMLAttributes } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'relative rounded-[22px] border border-ink-200/60 bg-white p-6 shadow-[var(--shadow-card)] transition-all duration-200',
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-[22px] before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent",
        interactive && 'hover:-translate-y-0.5 hover:border-brand-200/70 hover:shadow-[var(--shadow-glow)]',
        className,
      )}
      {...props}
    />
  )
}
