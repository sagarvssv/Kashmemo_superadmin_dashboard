import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, ClipboardCheck, Loader2, Receipt, Wallet, Clock3 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../store/authStore'
import { useCurrencyStore } from '../../store/currencyStore'
import { formatCurrency } from '../../lib/format'
import { extractErrorMessage } from '../../lib/api'
import { getDailyTicketReport, type DailyTicketReportEntry, type DailyTicketStatusBreakdown } from '../../lib/dashboard'

// Reserved status palette — same fixed hue-per-status mapping used on
// Overview and Approvals, kept identical here so a status means the same
// color everywhere in the app.
const STATUS_META = [
  { key: 'PENDING', label: 'Pending', color: '#d2942f' },
  { key: 'PARTIALLY_APPROVED', label: 'Partial', color: '#3b6fb0' },
  { key: 'APPROVED', label: 'Approved', color: '#3f8f5f' },
  { key: 'DISBURSED', label: 'Disbursed', color: '#b3453f' },
  { key: 'REJECTED', label: 'Rejected', color: '#d03b3b' },
] as const

const chartTooltipStyle = {
  borderRadius: 12,
  border: '1px solid #dfe8e0',
  boxShadow: '0 8px 24px -8px rgba(15,18,15,0.18)',
  fontSize: 13,
}

function emptyBreakdown(): DailyTicketStatusBreakdown {
  return { PENDING: 0, PARTIALLY_APPROVED: 0, APPROVED: 0, REJECTED: 0, DISBURSED: 0 }
}

function toDateInputValue(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDayLabel(dayKey: string) {
  const d = new Date(`${dayKey}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const today = new Date()
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(today.getDate() - 6)

const PRESETS = [
  {
    label: 'Last 7 days',
    range: () => [toDateInputValue(sevenDaysAgo), toDateInputValue(today)] as const,
  },
  {
    label: 'Last 30 days',
    range: () => {
      const start = new Date()
      start.setDate(today.getDate() - 29)
      return [toDateInputValue(start), toDateInputValue(today)] as const
    },
  },
  {
    label: 'This month',
    range: () => {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return [toDateInputValue(start), toDateInputValue(today)] as const
    },
  },
]

export default function Reports() {
  const role = useAuthStore((state) => state.user?.role)
  const currencyCode = useCurrencyStore((state) => state.currencyCode)
  const canView = role === 'CEO' || role === 'FINANCE_MANAGER'

  const [startDate, setStartDate] = useState(toDateInputValue(sevenDaysAgo))
  const [endDate, setEndDate] = useState(toDateInputValue(today))
  const [summary, setSummary] = useState<DailyTicketReportEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!canView || !startDate || !endDate) return
    setLoading(true)
    getDailyTicketReport(startDate, endDate)
      .then((res) => setSummary(res.data.summary))
      .catch((err) => {
        toast.error(extractErrorMessage(err))
        setSummary([])
      })
      .finally(() => setLoading(false))
  }, [startDate, endDate])

  if (!canView) {
    return (
      <Card className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_16px_-6px_rgba(44,110,69,0.55)]">
          <ClipboardCheck className="size-6" />
        </span>
        <h2 className="font-display text-lg font-bold text-ink-900">Restricted</h2>
        <p className="max-w-sm text-[15px] text-ink-500">Only the CEO or Finance Manager can view ticket reports.</p>
      </Card>
    )
  }

  const totals = summary.reduce(
    (acc, day) => {
      acc.totalCount += day.totalCount
      acc.totalAmount += day.totalAmount
      STATUS_META.forEach(({ key }) => {
        acc.count[key] += day.count[key]
        acc.amount[key] += day.amount[key]
      })
      return acc
    },
    { totalCount: 0, totalAmount: 0, count: emptyBreakdown(), amount: emptyBreakdown() },
  )

  const chartData = summary.map((day) => ({
    day: formatDayLabel(day.day),
    ...day.count,
  }))

  const kpis = [
    {
      label: 'Total tickets',
      value: String(totals.totalCount),
      icon: Receipt,
      chipBg: 'bg-brand-100',
      chipFg: 'text-brand-700',
    },
    {
      label: 'Total amount',
      value: formatCurrency(totals.totalAmount, currencyCode),
      icon: Wallet,
      chipBg: 'bg-[#e7f0fa]',
      chipFg: 'text-[#2d6ca6]',
    },
    {
      label: 'Disbursed amount',
      value: formatCurrency(totals.amount.DISBURSED, currencyCode),
      icon: BarChart3,
      chipBg: 'bg-[#fbe9e9]',
      chipFg: 'text-[#b3453f]',
    },
    {
      label: 'Pending tickets',
      value: String(totals.count.PENDING),
      icon: Clock3,
      chipBg: 'bg-gold-100',
      chipFg: 'text-gold-600',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Reports</h1>
        <p className="mt-1 text-[15px] text-ink-500">Day-by-day ticket volume and spend for a date range.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Start date" htmlFor="report-start" className="w-[160px]">
          <Input
            id="report-start"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field label="End date" htmlFor="report-end" className="w-[160px]">
          <Input
            id="report-end"
            type="date"
            value={endDate}
            min={startDate}
            max={toDateInputValue(today)}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2 pb-0.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                const [start, end] = preset.range()
                setStartDate(start)
                setEndDate(end)
              }}
              className="rounded-full bg-card px-3.5 py-1.5 text-sm font-medium text-ink-500 ring-1 ring-inset ring-ink-200 transition-colors hover:bg-ink-100 hover:text-ink-800"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, chipBg, chipFg }) => (
          <Card key={label} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-xl font-bold tabular-nums text-ink-900">{loading ? '—' : value}</p>
              <span className={`flex size-[26px] shrink-0 items-center justify-center rounded-lg ${chipBg} ${chipFg}`}>
                <Icon className="size-[14px]" />
              </span>
            </div>
            <p className="text-xs text-ink-500">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="font-display text-lg font-bold text-ink-900">Ticket volume by day</h2>
          <p className="text-sm text-ink-500">Stacked by status</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-16 text-ink-400">
            <Loader2 className="size-5 animate-spin" />
            Loading report…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-sm text-ink-400">No tickets raised in this range.</p>
          </div>
        ) : (
          <div className="h-72 px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#dfe8e0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#5f6b60', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5f6b60', fontSize: 11 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f0f6f1' }} contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {STATUS_META.map(({ key, label, color }) => (
                  <Bar key={key} dataKey={key} name={label} stackId="tickets" fill={color} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="font-display text-lg font-bold text-ink-900">Daily breakdown</h2>
          <p className="text-sm text-ink-500">Ticket count and amount per status, per day</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-16 text-ink-400">
            <Loader2 className="size-5 animate-spin" />
            Loading report…
          </div>
        ) : summary.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-sm text-ink-400">No tickets raised in this range.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-y border-ink-100 bg-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-6 py-3 font-semibold">Day</th>
                  {STATUS_META.map(({ key, label }) => (
                    <th key={key} className="px-4 py-3 text-right font-semibold">
                      {label}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((day) => (
                  <tr key={day.day} className="border-b border-ink-100 last:border-0 hover:bg-ink-100">
                    <td className="px-6 py-3.5 text-sm font-medium text-ink-800">{formatDayLabel(day.day)}</td>
                    {STATUS_META.map(({ key }) => (
                      <td key={key} className="px-4 py-3.5 text-right">
                        <p className="text-sm font-semibold tabular-nums text-ink-800">{day.count[key]}</p>
                        <p className="text-xs tabular-nums text-ink-400">
                          {formatCurrency(day.amount[key], currencyCode)}
                        </p>
                      </td>
                    ))}
                    <td className="px-6 py-3.5 text-right">
                      <p className="text-sm font-semibold tabular-nums text-ink-800">{day.totalCount}</p>
                      <p className="text-xs tabular-nums text-ink-400">{formatCurrency(day.totalAmount, currencyCode)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
