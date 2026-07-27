import { type HTMLAttributes } from 'react'
import clsx from 'clsx'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-2xl border border-ink-200/70 bg-white p-6 shadow-soft', className)}
      {...props}
    />
  )
}
