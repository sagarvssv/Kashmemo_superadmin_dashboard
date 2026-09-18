import clsx from 'clsx'

export function Logo({ className, mark = 'light' }: { className?: string; mark?: 'light' | 'dark' }) {
  return (
    <div className={clsx('inline-flex items-center gap-2.5', className)}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="34" height="34" rx="10" fill="#3F8F5F" />
        <path
          d="M10 22V12.5C10 11.6716 10.6716 11 11.5 11H22.5"
          stroke="#EAF6EC"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M10 17H20.5C21.3284 17 22 17.6716 22 18.5V21.5C22 22.3284 21.3284 23 20.5 23H12"
          stroke="#EAF6EC"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <span className={clsx('font-display text-lg font-bold', mark === 'light' ? 'text-white' : 'text-ink-900')}>
        Kashmemo
      </span>
    </div>
  )
}
