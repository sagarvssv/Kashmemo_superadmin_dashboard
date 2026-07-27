import { Check } from 'lucide-react'
import clsx from 'clsx'
import type { Plan } from '../../lib/constants'

interface PlanCardProps {
  id: Plan
  name: string
  tagline: string
  price: string
  cadence: string
  features: string[]
  highlight?: boolean
  selected: boolean
  onSelect: (id: Plan) => void
}

export function PlanCard({ id, name, tagline, price, cadence, features, highlight, selected, onSelect }: PlanCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={clsx(
        'relative flex w-full flex-col gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-150',
        selected
          ? 'border-brand-500 bg-brand-50 shadow-soft'
          : 'border-ink-200 bg-white hover:border-ink-300',
      )}
    >
      {highlight && (
        <span className="absolute -top-3 right-5 rounded-full bg-gold-400 px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-ink-900">
          Most popular
        </span>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-ink-900">{name}</h3>
          <p className="mt-0.5 text-sm text-ink-500">{tagline}</p>
        </div>
        <span
          className={clsx(
            'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            selected ? 'border-brand-500 bg-brand-500' : 'border-ink-300 bg-white',
          )}
        >
          {selected && <Check className="size-3.5 text-white" strokeWidth={3} />}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-extrabold text-ink-900">{price}</span>
        <span className="text-sm text-ink-400">{cadence}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-ink-600">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-500" />
            {feature}
          </li>
        ))}
      </ul>
    </button>
  )
}
