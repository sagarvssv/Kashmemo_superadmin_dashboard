import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  Banknote,
  Clock3,
  PiggyBank,
  Radio,
  Receipt,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { useAuthStore } from '../../store/authStore'
import { useCurrencyStore } from '../../store/currencyStore'
import { INDUSTRY_TYPES } from '../../lib/constants'
import { listEmployees, type Employee } from '../../lib/employees'
import { getDashboardSummary, getDisbursedTicketsSummary, type DashboardSummary, type DisbursedTicketsSummary } from '../../lib/dashboard'
import { listRecentActivities, type ActivityLogEntry } from '../../lib/activity'
import { connectSocket } from '../../lib/socket'
import { formatCurrency, formatRelativeTime, MONTH_NAMES } from '../../lib/format'
import { extractErrorMessage } from '../../lib/api'

const now = new Date()
const YEAR_OPTIONS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2]

const MAX_ACTIVITY_ROWS = 8

// Fixed hue order, validated CVD-safe (see index.css --chart-1..5 / dataviz skill).
// Never cycled or reassigned per render — a department keeps its slot for as
// long as it exists; overflow beyond 5 folds into a neutral "Other" bucket.
const CHART_COLORS = ['#3f8f5f', '#d2942f', '#3b6fb0', '#b3457a', '#6a4fb0']
const OTHER_COLOR = '#c3d0c5'

function activityTypeLabel(type: string) {
  return type
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

function activityVisual(type: string) {
  const t = type.toUpperCase()
  if (t.includes('REJECT')) return { icon: XCircle, bg: 'bg-[#fbe9e9]', fg: 'text-[#d03b3b]' }
  if (t.includes('DISBURSE')) return { icon: Banknote, bg: 'bg-brand-100', fg: 'text-brand-700' }
  if (t.includes('BUDGET')) return { icon: Wallet, bg: 'bg-gold-100', fg: 'text-gold-700' }
  if (t.includes('TICKET')) return { icon: Receipt, bg: 'bg-brand-50', fg: 'text-brand-700' }
  if (t.includes('EMPLOYEE') || t.includes('HIRE')) return { icon: UserPlus, bg: 'bg-[#eaf1fd]', fg: 'text-[#2f5fb3]' }
  return { icon: PiggyBank, bg: 'bg-ink-100', fg: 'text-ink-500' }
}

// Ticket status — a reserved, fixed-meaning status palette (not the
// categorical department palette above), matching the badge colors already
// used everywhere else in the app (Approvals.tsx, Team.tsx).
const TICKET_STATUS_META: Array<{
  key: 'PENDING' | 'PARTIALLY_APPROVED' | 'APPROVED' | 'DISBURSED' | 'REJECTED'
  label: string
  fill: string
}> = [
  { key: 'PENDING', label: 'Pending', fill: '#d2942f' },
  { key: 'PARTIALLY_APPROVED', label: 'Partial', fill: '#3b6fb0' },
  { key: 'APPROVED', label: 'Approved', fill: '#3f8f5f' },
  { key: 'DISBURSED', label: 'Disbursed', fill: '#b3453f' },
  { key: 'REJECTED', label: 'Rejected', fill: '#d03b3b' },
]

const chartTooltipStyle = {
  borderRadius: 12,
  border: '1px solid #dfe8e0',
  boxShadow: '0 8px 24px -8px rgba(15,18,15,0.18)',
  fontSize: 13,
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
  const [disbursedSummary, setDisbursedSummary] = useState<DisbursedTicketsSummary | null>(null)

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
    Promise.all([getDashboardSummary(budgetMonth, budgetYear), getDisbursedTicketsSummary(budgetMonth, budgetYear)])
      .then(([summaryRes, disbursedRes]) => {
        setSummary(summaryRes.data)
        setDisbursedSummary(disbursedRes.data)
      })
      .catch((err) => {
        toast.error(extractErrorMessage(err))
        setSummary(null)
        setDisbursedSummary(null)
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
    // The backend doesn't emit a single generic 'dashboard:update' —
    // it emits per-domain events (tickets, budget) that each affect the
    // summary numbers here, so refetch on any of them. 'dashboard:update'
    // is kept too in case a generic emit is added later.
    const handleDashboardUpdate = () => fetchSummaryRef.current()
    socket.on('dashboard:update', handleDashboardUpdate)
    socket.on('ticket:status-update', handleDashboardUpdate)
    socket.on('ticket:created', handleDashboardUpdate)
    socket.on('budget:update', handleDashboardUpdate)
    return () => {
      socket.off('dashboard:update', handleDashboardUpdate)
      socket.off('ticket:status-update', handleDashboardUpdate)
      socket.off('ticket:created', handleDashboardUpdate)
      socket.off('budget:update', handleDashboardUpdate)
    }
  }, [])

  const budgetProgress =
    summary && summary.budget.totalAllocatedBudget > 0
      ? Math.min(100, (summary.budget.totalSpent / summary.budget.totalAllocatedBudget) * 100)
      : 0

  // Chart 1 — budget allocation share by department (identity/categorical).
  // Top 4 departments keep their own hue; anything beyond that folds into a
  // neutral "Other" slot rather than generating a 6th hue.
  const sortedDepartments = [...(summary?.departments ?? [])].sort((a, b) => b.totalAllocated - a.totalAllocated)
  const showAllDepartments = sortedDepartments.length <= CHART_COLORS.length
  const topCount = showAllDepartments ? sortedDepartments.length : CHART_COLORS.length - 1
  const topDepartments = sortedDepartments.slice(0, topCount)
  const otherAllocated = showAllDepartments
    ? 0
    : sortedDepartments.slice(topCount).reduce((sum, d) => sum + d.totalAllocated, 0)
  const allocationChartData = [
    ...topDepartments.map((d, i) => ({ name: d.departmentId.name, value: d.totalAllocated, fill: CHART_COLORS[i] })),
    ...(otherAllocated > 0 ? [{ name: 'Other', value: otherAllocated, fill: OTHER_COLOR }] : []),
  ].filter((d) => d.value > 0)
  const allocationTotal = allocationChartData.reduce((sum, d) => sum + d.value, 0)

  // Chart 2 — spend by department. Single series, one color (measures
  // magnitude, not identity) — unlike the donut, this one never lumps
  // departments into "Other": every department gets its own bar so nothing
  // is hidden, however large the org gets. The list scrolls instead of
  // growing unboundedly tall.
  const spendListData = sortedDepartments.map((d) => ({
    name: d.departmentId.name,
    spent: d.spent,
    allocated: d.totalAllocated,
  }))
  // Taller per-row height than a single-series bar list needs, since each
  // department now renders two grouped bars (Allocated + Spent) side by side.
  const spendListHeight = Math.max(240, spendListData.length * 56)

  // Chart 3 — ticket status breakdown (reserved status palette).
  const ticketRadialData = TICKET_STATUS_META.map(({ key, label, fill }) => ({
    name: label,
    value: summary?.tickets[key] ?? 0,
    fill,
  }))
  const ticketTotal = ticketRadialData.reduce((sum, d) => sum + d.value, 0)

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
      href: '/dashboard/petty-cash',
      icon: Wallet,
      chipBg: 'bg-brand-100',
      chipFg: 'text-brand-700',
      progress: summaryLoading || !summary ? undefined : budgetProgress,
    },
    {
      label: `Disbursed · ${MONTH_NAMES[budgetMonth - 1]} ${budgetYear}`,
      value:
        summaryLoading || !disbursedSummary ? '—' : formatCurrency(disbursedSummary.totalDisbursedAmount, currencyCode),
      note:
        summaryLoading || !summary
          ? undefined
          : `${summary.tickets.DISBURSED} completed ticket${summary.tickets.DISBURSED === 1 ? '' : 's'}`,
      delta: 'View tickets',
      href: '/dashboard/approvals',
      icon: Receipt,
      chipBg: 'bg-[#e7f0fa]',
      chipFg: 'text-[#2d6ca6]',
    },
    {
      label: 'Pending approvals',
      value: summaryLoading || !summary ? '—' : String(summary.tickets.PENDING),
      note:
        summaryLoading || !summary || !summary.tickets.PARTIALLY_APPROVED
          ? undefined
          : `+${summary.tickets.PARTIALLY_APPROVED} partially approved`,
      delta: 'View tickets',
      href: '/dashboard/approvals',
      icon: Clock3,
      chipBg: 'bg-gold-100',
      chipFg: 'text-gold-600',
    },
    {
      label: 'Active team members',
      value: employeesLoading || totalEmployees === null ? '—' : String(totalEmployees),
      delta: 'View team',
      href: '/dashboard/team',
      icon: Users,
      chipBg: 'bg-[#efeafb]',
      chipFg: 'text-[#6a4fb0]',
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
        {kpis.map(({ label, value, note, delta, href, icon: Icon, chipBg, chipFg, progress }) => (
          <Link key={label} to={href} className="block">
            <Card interactive className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl font-bold tabular-nums text-ink-900">{value}</p>
                <span className={`flex size-[26px] shrink-0 items-center justify-center rounded-lg ${chipBg} ${chipFg}`}>
                  <Icon className="size-[14px]" />
                </span>
              </div>
              <div>
                <p className="text-xs text-ink-500">{label}</p>
                {note && <p className="mt-0.5 text-[11px] font-medium text-ink-400">{note}</p>}
              </div>
              {progress !== undefined && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <span className="flex items-center gap-1 text-xs font-medium text-brand-700">
                {delta}
                <ArrowRight className="size-3.5" />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="!p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="font-display text-lg font-bold text-ink-900">Budget allocation</h2>
            <p className="text-sm text-ink-500">Share by department · {MONTH_NAMES[budgetMonth - 1]}</p>
          </div>

          {allocationChartData.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-16 text-center">
              <p className="text-sm text-ink-400">No budgets allocated yet.</p>
            </div>
          ) : (
            <>
              <div className="relative h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="92%"
                      paddingAngle={2}
                      cornerRadius={4}
                      strokeWidth={0}
                    >
                      {allocationChartData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value, name) => [formatCurrency(Number(value), currencyCode), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-display text-xl font-extrabold tabular-nums text-ink-900">
                    {formatCurrency(allocationTotal, currencyCode)}
                  </p>
                  <p className="text-xs text-ink-400">Total allocated</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 px-6 pb-6">
                {allocationChartData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-ink-600">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: d.fill }} />
                    <span className="truncate">{d.name}</span>
                    <span className="ml-auto shrink-0 font-semibold tabular-nums text-ink-800">
                      {formatCurrency(d.value, currencyCode)}
                    </span>
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="font-display text-lg font-bold text-ink-900">Spend by department</h2>
            <p className="text-sm text-ink-500">
              All {spendListData.length} department{spendListData.length === 1 ? '' : 's'} · {MONTH_NAMES[budgetMonth - 1]}{' '}
              {budgetYear}
            </p>
          </div>

          {spendListData.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-16 text-center">
              <p className="text-sm text-ink-400">No departments yet.</p>
            </div>
          ) : (
            <div style={{ height: spendListHeight }} className="max-h-64 overflow-y-auto px-2 pb-2 pt-4">
              <ResponsiveContainer width="100%" height={Math.max(spendListHeight - 16, 200)}>
                <BarChart data={spendListData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#dfe8e0" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#5f6b60', fontSize: 11 }}
                    tickFormatter={(v) => `${v >= 1000 ? `${v / 1000}k` : v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={92}
                    tick={{ fill: '#4a544c', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f0f6f1' }}
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => formatCurrency(Number(value), currencyCode)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="allocated" name="Allocated" fill="#3f8f5f" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="spent" name="Spent" fill="#d2942f" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="font-display text-lg font-bold text-ink-900">Ticket status</h2>
            <p className="text-sm text-ink-500">Approval pipeline for {MONTH_NAMES[budgetMonth - 1]}</p>
          </div>

          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketRadialData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  cornerRadius={4}
                  strokeWidth={0}
                >
                  {ticketRadialData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value, _name, item) => [value, item?.payload?.name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-2xl font-extrabold tabular-nums text-ink-900">{ticketTotal}</p>
              <p className="text-xs text-ink-400">Tickets</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-6 pb-6">
            {ticketRadialData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-ink-600">
                <span className="size-2 shrink-0 rounded-full" style={{ background: d.fill }} />
                <span className="truncate">{d.name}</span>
                <span className="ml-auto shrink-0 font-semibold tabular-nums text-ink-800">{d.value}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="!p-0 overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between p-6 pb-0">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Recent activity</h2>
              <p className="text-sm text-ink-500">Live updates across your organization</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
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
            <div className="mt-3 max-h-[420px] overflow-y-auto px-3 pb-1">
              {liveActivity.map((entry, i) => {
                const { icon: Icon, bg, fg } = activityVisual(entry.type)
                return (
                  <div key={entry.id} className="flex gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-ink-100/70">
                    <div className="flex flex-col items-center">
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${bg} ${fg}`}>
                        <Icon className="size-4" />
                      </span>
                      {i < liveActivity.length - 1 && <span className="mt-1 w-px flex-1 bg-ink-100" />}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 pb-3 pt-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-ink-800">{entry.message}</p>
                        <span className="shrink-0 pt-0.5 text-xs text-ink-400">{formatRelativeTime(entry.createdAt)}</span>
                      </div>
                      <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${bg} ${fg}`}>
                        {activityTypeLabel(entry.type)}
                      </span>
                    </div>
                  </div>
                )
              })}
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
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-ink-100/70"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 font-display text-xs font-bold text-brand-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
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
