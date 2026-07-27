import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, TrendingUp, Wallet } from 'lucide-react'
import { Logo } from '../ui/Logo'

const highlights = [
  { icon: Wallet, text: 'Track every rupee of petty cash across branches, in real time.' },
  { icon: TrendingUp, text: 'Spot spending trends before they become budget surprises.' },
  { icon: ShieldCheck, text: 'Approval workflows built for accountability, not bureaucracy.' },
]

export function AuthLayout({
  children,
  title,
  subtitle,
  size = 'default',
}: {
  children: ReactNode
  title: string
  subtitle: string
  size?: 'default' | 'wide'
}) {
  const wide = size === 'wide'

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside
        className={
          'relative hidden shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 px-12 py-12 text-white ' +
          (wide ? 'xl:flex xl:w-[360px] 2xl:w-[400px]' : 'lg:flex lg:w-[42%]')
        }
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand-600/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 size-72 rounded-full bg-gold-400/10 blur-3xl"
          aria-hidden
        />

        <Logo mark="light" className="relative z-10" />

        <div className="relative z-10 flex flex-col gap-10">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md font-display text-4xl font-bold leading-tight"
          >
            Run your organization's petty cash like a CFO, not a spreadsheet.
          </motion.h1>

          <div className="flex flex-col gap-5">
            {highlights.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                className="flex items-start gap-3.5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="size-[18px] text-gold-300" />
                </span>
                <p className="pt-1.5 text-[15px] text-brand-100">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm text-brand-200">
          © {new Date().getFullYear()} Kashmemo. Built for founders who count every rupee.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={'w-full ' + (wide ? 'max-w-4xl' : 'max-w-md')}
        >
          <div className={wide ? 'mb-8 xl:hidden' : 'mb-8 lg:hidden'}>
            <Logo mark="dark" />
          </div>
          <div className={wide ? 'mx-auto w-full max-w-xl' : ''}>
            <h2 className="font-display text-[28px] font-extrabold text-ink-900">{title}</h2>
            <p className="mt-1.5 text-[15px] text-ink-500">{subtitle}</p>
          </div>
          <div className="mt-8">{children}</div>
        </motion.div>
      </main>
    </div>
  )
}
