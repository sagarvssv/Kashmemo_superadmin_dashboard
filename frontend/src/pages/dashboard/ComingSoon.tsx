import { Sparkles } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export default function ComingSoon({ title }: { title: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Sparkles className="size-6" />
      </span>
      <h1 className="font-display text-xl font-bold text-ink-900">{title}</h1>
      <p className="max-w-sm text-[15px] text-ink-500">
        This module is on the roadmap and isn't wired up to the backend yet. Check back soon.
      </p>
    </Card>
  )
}
