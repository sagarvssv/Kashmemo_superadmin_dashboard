import toast from 'react-hot-toast'
import { Copy } from 'lucide-react'

export function CopyableField({ label, value }: { label: string; value: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied to clipboard.`)
    } catch {
      toast.error('Could not copy to clipboard.')
    }
  }

  return (
    <div className="rounded-xl border border-ink-100 px-4 py-3">
      <p className="text-xs text-ink-400">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-mono text-sm font-medium text-ink-800" title={value}>
          {value}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
          aria-label={`Copy ${label}`}
        >
          <Copy className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
