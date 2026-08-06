import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Clock3, Radio, Receipt, Users, Wallet } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { useAuthStore } from '../../store/authStore'
import { useCurrencyStore } from '../../store/currencyStore'
import { INDUSTRY_TYPES } from '../../lib/constants'
import { listEmployees, type Employee } from '../../lib/employees'
import { getDashboardSummary, type DashboardSummary } from '../../lib/dashboard'
import { listRecentActivities, type ActivityLogEntry } from '../../lib/activity'
import { connectSocket } from '../../lib/socket'
import { formatCurrency, MONTH_NAMES } from '../../lib/format'
import { extractErrorMessage } from '../../lib/api'

const now = new Date()
const YEAR_OPTIONS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2]

const flowData = [
  { month: 'Feb', replenished: 42000, spent: 31500 },
  { month: 'Mar', replenished: 38000, spent: 33200 },
  { month: 'Apr', replenished: 51000, spent: 40100 },
  { month: 'May', replenished: 46500, spent: 37800 },
  { month: 'Jun', replenished: 58000, spent: 44300 },
  { month: 'Jul', replenished: 62500, spent: 41900 },
]

const MAX_ACTIVITY_ROWS = 8

function activityTypeLabel(type: string) {
  return type
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export default function Overview() {
  const user = useAuthStore((state) => state.user)
  const orgProfile = useAuthStore((state) => state.orgProfile)
  const currencyCode = useCurrencyStore((state) => state.currencyCode)
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const industryLabel = INDUSTRY_TYPES.find((i) => i.value === orgProfile?.industryType)?.label

  const [recentHires, setRecentHires] = useState<Employee[]>([])
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null)
  const [employeesLoading, setEmployeesLoading] = useState(true)

  const [budgetMonth, setBudgetMonth] = useState(now.getMonth() + 1)
  const [budgetYear, setBudgetYear] = useState(now.getFullYear())
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const [liveActivity, setLiveActivity] = useState<ActivityLogEntry[]>([])
  const [activityNextCursor, setActivityNextCursor] = useState<string | null>(null)
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false)

  useEffect(() => {
    listRecentActivities({ limit: MAX_ACTIVITY_ROWS })
      .then((res) => {
        setLiveActivity(res.data)
        setActivityNextCursor(res.nextCursor)
      })
      .catch(() => setLiveActivity([]))
  }, [])

  const handleLoadMoreActivity = () => {
    if (!activityNextCursor) return
    setLoadingMoreActivity(true)
    listRecentActivities({ limit: MAX_ACTIVITY_ROWS, cursor: activityNextCursor })
      .then((res) => {
        setLiveActivity((prev) => [...prev, ...res.data])
        setActivityNextCursor(res.nextCursor)
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoadingMoreActivity(false))
  }

  useEffect(() => {
    // connectSocket() is idempotent — DashboardLayout owns the actual
    // connect/disconnect lifecycle for the whole dashboard session; this
    // just guarantees a socket exists before attaching the listener,
    // regardless of effect mount order between parent and child.
    const socket = connectSocket()
    const handleActivity = (entry: ActivityLogEntry) => {
      setLiveActivity((prev) => [entry, ...prev])
    }
    socket.on('activity', handleActivity)
    return () => {
      socket.off('activity', handleActivity)
    }
  }, [])

  useEffect(() => {
    listEmployees({ page: 1, limit: 5 })
      .then((res) => {
        setRecentHires(res.data)
        setTotalEmployees(res.pagination.total)
      })
      .catch(() => {
        setRecentHires([])
        setTotalEmployees(null)
      })
      .finally(() => setEmployeesLoading(false))
  }, [])

  const fetchSummary = () => {
    setSummaryLoading(true)
    getDashboardSummary(budgetMonth, budgetYear)
      .then((res) => setSummary(res.data))
      .catch((err) => {
        toast.error(extractErrorMessage(err))
        setSummary(null)
      })
      .finally(() => setSummaryLoading(false))
  }
  const fetchSummaryRef = useRef(fetchSummary)
  fetchSummaryRef.current = fetchSummary

  useEffect(() => {
    fetchSummary()
  }, [budgetMonth, budgetYear])

  useEffect(() => {
    const socket = connectSocket()
    const handleDashboardUpdate = () => fetchSummaryRef.current()
    socket.on('dashboard:update', handleDashboardUpdate)
    return () => {
      socket.off('dashboard:update', handleDashboardUpdate)
    }
  }, [])

  const budgetProgress =
    summary && summary.budget.totalAllocatedBudget > 0
      ? Math.min(100, (summary.budget.totalSpent / summary.budget.totalAllocatedBudget) * 100)
      : 0

  const kpis = [
    {
      label: `Budget · ${MONTH_NAMES[budgetMonth - 1]} ${budgetYear}`,
      value:
        summaryLoading || !summary
          ? '—'
          : `${formatCurrency(summary.budget.totalSpent, currencyCode)} / ${formatCurrency(
              summary.budget.totalAllocatedBudget,
              currencyCode,
            )}`,
      delta: 'View petty cash',
      trend: 'neutral' as const,
      icon: Wallet,
      progress: summaryLoading || !summary ? undefined : budgetProgress,
    },
    {
      label: 'Disbursed this month',
      value: summaryLoading || !summary ? '—' : String(summary.tickets.DISBURSED),
      delta: 'Completed tickets',
      trend: 'neutral' as const,
      icon: Receipt,
    },
    {
      label: 'Pending approvals',
      value: summaryLoading || !summary ? '—' : String(summary.tickets.PENDING),
      delta: 'View tickets',
      trend: 'neutral' as const,
      icon: Clock3,
    },
    {
      label: 'Active team members',
      value: employeesLoading || totalEmployees === null ? '—' : String(totalEmployees),
      delta: 'View team',
      trend: 'neutral' as const,
      icon: Users,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Welcome back, {firstName}</h1>
          <p className="mt-1 text-[15px] text-ink-500">
            {user?.companyName
              ? `Here's how ${user.companyName} is tracking petty cash${
                  orgProfile ? ` across ${orgProfile.country}${industryLabel ? ` in ${industryLabel}` : ''}` : ''
                }.`
              : "Here's what's happening with your organization's petty cash today."}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Select
            value={budgetMonth}
            onChange={(e) => setBudgetMonth(Number(e.target.value))}
            className="max-w-[150px]"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </Select>
          <Select
            value={budgetYear}
            onChange={(e) => setBudgetYear(Number(e.target.value))}
            className="max-w-[110px]"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, delta, trend, icon: Icon, progress }) => (
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
              {progress !== undefined && (
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
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
                tickFormatter={(v) => `${currencyCode} ${v / 1000}k`}
                width={64}
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
                  formatCurrency(Number(value), currencyCode),
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="!p-0 overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between p-6 pb-0">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Recent activity</h2>
              <p className="text-sm text-ink-500">Live updates across your organization</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1baf7a]">
              <Radio className="size-3.5" />
              Live
            </span>
          </div>
          {liveActivity.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-14 text-center">
              <p className="text-sm font-medium text-ink-600">Waiting for activity…</p>
              <p className="text-sm text-ink-400">Budget allocations and ticket updates will show up here as they happen.</p>
            </div>
          ) : (
            <div className="mt-4 max-h-[420px] overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-y border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                    <th className="px-6 py-3 font-semibold">Activity</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {liveActivity.map((entry) => (
                    <tr key={entry.id} className="border-b border-ink-100 last:border-0">
                      <td className="px-6 py-3.5 text-sm font-medium text-ink-800">{entry.message}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          {activityTypeLabel(entry.type)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-ink-500">
                        {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activityNextCursor && (
            <div className="flex justify-center border-t border-ink-100 py-3">
              <Button
                variant="secondary"
                onClick={handleLoadMoreActivity}
                loading={loadingMoreActivity}
                className="!px-4 !py-2 text-sm"
              >
                Load more
              </Button>
            </div>
          )}
          <div className="h-2" />
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-0">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Team</h2>
              <p className="text-sm text-ink-500">Recently added employees</p>
            </div>
          </div>

          <div className="flex flex-col gap-1 p-3 pt-4">
            {employeesLoading ? (
              <p className="px-3 py-6 text-center text-sm text-ink-400">Loading…</p>
            ) : recentHires.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-400">No employees added yet.</p>
            ) : (
              recentHires.map((employee) => {
                const initials = employee.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
                return (
                  <div key={employee.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 font-display text-xs font-bold text-brand-800">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-800">{employee.name}</p>
                      <p className="truncate text-xs text-ink-400">{employee.designation}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <Link
            to="/dashboard/team"
            className="flex items-center justify-center gap-1.5 border-t border-ink-100 px-6 py-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            View all team members
            <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>
    </div>
  )
}
