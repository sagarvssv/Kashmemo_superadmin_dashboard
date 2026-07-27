import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Clock3, Users, Wallet, TrendingDown } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import { INDUSTRY_TYPES } from '../../lib/constants'

const flowData = [
  { month: 'Feb', replenished: 42000, spent: 31500 },
  { month: 'Mar', replenished: 38000, spent: 33200 },
  { month: 'Apr', replenished: 51000, spent: 40100 },
  { month: 'May', replenished: 46500, spent: 37800 },
  { month: 'Jun', replenished: 58000, spent: 44300 },
  { month: 'Jul', replenished: 62500, spent: 41900 },
]

const kpis = [
  {
    label: 'Total petty cash balance',
    value: '₹2,84,600',
    delta: '+8.2%',
    trend: 'up' as const,
    icon: Wallet,
  },
  {
    label: "This month's expenses",
    value: '₹41,900',
    delta: '-5.4%',
    trend: 'down' as const,
    icon: TrendingDown,
  },
  {
    label: 'Pending approvals',
    value: '7',
    delta: '3 due today',
    trend: 'neutral' as const,
    icon: Clock3,
  },
  {
    label: 'Active team members',
    value: '12',
    delta: '+2 this month',
    trend: 'up' as const,
    icon: Users,
  },
]

const activity = [
  { name: 'Office supplies — Andheri branch', by: 'Rohit Sharma', amount: '₹3,200', status: 'Approved' },
  { name: 'Client lunch reimbursement', by: 'Priya Nair', amount: '₹1,850', status: 'Pending' },
  { name: 'Courier & logistics', by: 'Amit Verma', amount: '₹960', status: 'Approved' },
  { name: 'Emergency generator fuel', by: 'Sana Khan', amount: '₹5,400', status: 'Rejected' },
  { name: 'Stationery restock', by: 'Rohit Sharma', amount: '₹1,120', status: 'Pending' },
]

const statusStyles: Record<string, string> = {
  Approved: 'bg-[#e6f6e6] text-[#0ca30c]',
  Pending: 'bg-[#fef3de] text-[#9c6716]',
  Rejected: 'bg-[#fbe9e9] text-[#d03b3b]',
}

function formatINR(value: number) {
  return `₹${value.toLocaleString('en-IN')}`
}

export default function Overview() {
  const { user, orgProfile } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const industryLabel = INDUSTRY_TYPES.find((i) => i.value === orgProfile?.industryType)?.label

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Welcome back, {firstName}</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          {orgProfile
            ? `Here's how ${orgProfile.companyName} is tracking petty cash across ${orgProfile.country}${
                industryLabel ? ` in ${industryLabel}` : ''
              }.`
            : "Here's what's happening with your organization's petty cash today."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, delta, trend, icon: Icon }) => (
          <Card key={label} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-[18px]" />
              </span>
              {trend !== 'neutral' && (
                <span
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    trend === 'up' ? 'text-[#0ca30c]' : 'text-ink-500'
                  }`}
                >
                  {trend === 'up' ? (
                    <ArrowUpRight className="size-4" />
                  ) : (
                    <ArrowDownRight className="size-4" />
                  )}
                  {delta}
                </span>
              )}
              {trend === 'neutral' && <span className="text-sm font-semibold text-gold-500">{delta}</span>}
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold tabular-nums text-ink-900">{value}</p>
              <p className="mt-0.5 text-sm text-ink-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-col gap-1 p-6 pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">Petty cash flow</h2>
            <p className="text-sm text-ink-500">Replenishments vs. spend over the last 6 months</p>
          </div>
          <div className="flex items-center gap-4 pb-2 sm:pb-0">
            <span className="flex items-center gap-2 text-sm text-ink-600">
              <span className="size-2.5 rounded-full" style={{ background: '#1baf7a' }} />
              Replenished
            </span>
            <span className="flex items-center gap-2 text-sm text-ink-600">
              <span className="size-2.5 rounded-full" style={{ background: '#eb6834' }} />
              Spent
            </span>
          </div>
        </div>

        <div className="h-72 px-2 pb-4 pt-4 sm:px-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={flowData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="replenishedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1baf7a" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#1baf7a" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="spentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eb6834" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#eb6834" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e1e0d9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#898781', fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#898781', fontSize: 12 }}
                tickFormatter={(v) => `₹${v / 1000}k`}
                width={48}
              />
              <Tooltip
                cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e1e0d9',
                  boxShadow: '0 8px 24px -8px rgba(28,26,23,0.18)',
                  fontSize: 13,
                }}
                formatter={(value, name) => [
                  formatINR(Number(value)),
                  name === 'replenished' ? 'Replenished' : 'Spent',
                ]}
              />
              <Area
                type="monotone"
                dataKey="replenished"
                stroke="#1baf7a"
                strokeWidth={2}
                fill="url(#replenishedFill)"
              />
              <Area type="monotone" dataKey="spent" stroke="#eb6834" strokeWidth={2} fill="url(#spentFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="font-display text-lg font-bold text-ink-900">Recent activity</h2>
          <p className="text-sm text-ink-500">Latest petty cash requests across your organization</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-y border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-6 py-3 font-semibold">Description</th>
                <th className="px-6 py-3 font-semibold">Requested by</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((row) => (
                <tr key={row.name} className="border-b border-ink-100 last:border-0">
                  <td className="px-6 py-3.5 text-sm font-medium text-ink-800">{row.name}</td>
                  <td className="px-6 py-3.5 text-sm text-ink-500">{row.by}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold tabular-nums text-ink-800">{row.amount}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="h-2" />
      </Card>
    </div>
  )
}
