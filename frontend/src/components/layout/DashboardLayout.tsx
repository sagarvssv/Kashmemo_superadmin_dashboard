import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Wallet,
  ClipboardCheck,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
} from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '../ui/Logo'
import { NotificationBell } from './NotificationBell'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { getNotifications, markNotificationRead } from '../../lib/notifications'
import { logoutRequest } from '../../lib/api'
import { connectSocket, disconnectSocket } from '../../lib/socket'
import { formatRelativeTime } from '../../lib/format'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutGrid
  end?: boolean
}

const baseNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/dashboard/petty-cash', label: 'Petty Cash', icon: Wallet },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { to: '/dashboard/team', label: 'Team', icon: Users },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const approvalsNavItem: NavItem = { to: '/dashboard/approvals', label: 'Approvals', icon: ClipboardCheck }

const planLabel: Record<string, string> = {
  STARTER: 'Starter plan',
  GROW: 'Grow plan',
  ENTERPRISE: 'Enterprise plan',
}

const roleSuiteLabel: Record<string, string> = {
  CEO: 'CEO Suite',
  HR: 'HR Suite',
  FINANCE_MANAGER: 'Finance Suite',
  MANAGER: 'Manager Suite',
}

export function DashboardLayout() {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const canManageTickets = user?.role === 'CEO' || user?.role === 'HR' || user?.role === 'FINANCE_MANAGER'
  const navItems = canManageTickets
    ? [...baseNavItems.slice(0, 2), approvalsNavItem, ...baseNavItems.slice(2)]
    : baseNavItems

  const notifications = useNotificationStore((state) => state.items)
  const notificationsLoaded = useNotificationStore((state) => state.loaded)
  const setNotificationItems = useNotificationStore((state) => state.setItems)
  const setNotificationsLoaded = useNotificationStore((state) => state.setLoaded)
  const markNotificationReadLocal = useNotificationStore((state) => state.markReadLocal)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  useEffect(() => {
    connectSocket()
    return () => disconnectSocket()
  }, [])

  // Shares the same store as NotificationBell — whichever of the two mounts
  // first does the actual fetch, the other just reads what's already there.
  useEffect(() => {
    if (notificationsLoaded) return
    setNotificationsLoading(true)
    getNotifications({ limit: 12 })
      .then((res) => {
        setNotificationItems(res.data)
        setNotificationsLoaded(true)
      })
      .catch(() => {})
      .finally(() => setNotificationsLoading(false))
  }, [notificationsLoaded, setNotificationItems, setNotificationsLoaded])

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (isRead) return
    markNotificationReadLocal(id)
    markNotificationRead(id).catch(() => {})
  }

  const handleLogout = () => {
    logoutRequest().catch(() => {})
    clearAuth()
    navigate('/login')
  }

  const initials = (user?.name ?? 'C E')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <div className="px-6 pb-1 pt-7">
          <Logo mark="dark" />
        </div>
        <p className="mb-6 pl-[46px] text-[10px] font-semibold uppercase tracking-wide text-brand-700">
          {roleSuiteLabel[user?.role ?? ''] ?? 'Admin Suite'}
        </p>
        <nav className="flex flex-col gap-0.5 px-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-white text-brand-700 shadow-[0_1px_2px_rgba(15,18,15,0.06)]'
                    : 'text-ink-500 hover:bg-white/70 hover:text-ink-900',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col px-4">
        <p className="shrink-0 px-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
          Notifications
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="size-4 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-1 py-4 text-xs text-ink-400">You're all caught up.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.isRead)}
                  className={clsx(
                    'rounded-lg bg-white px-2.5 py-2 text-left shadow-[0_1px_2px_rgba(15,18,15,0.04)] transition-colors hover:bg-brand-50',
                  )}
                >
                  <p
                    className={clsx(
                      'line-clamp-2 text-xs leading-snug',
                      n.isRead ? 'text-ink-500' : 'font-medium text-ink-900',
                    )}
                  >
                    {n.message}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-400">{formatRelativeTime(n.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="m-4 shrink-0 rounded-xl border border-ink-200 bg-white p-4">
        <p className="font-display text-sm font-bold text-ink-900">
          {planLabel[user?.plan ?? 'STARTER']}
        </p>
        <p className="mt-1 text-xs text-ink-500">
          {user?.plan === 'ENTERPRISE'
            ? 'You have full access to every feature.'
            : 'Upgrade to unlock more team seats & workflows.'}
        </p>
        {user?.plan !== 'ENTERPRISE' && (
          <button className="mt-3 w-full rounded-lg bg-gradient-to-b from-brand-500 to-brand-700 px-3 py-2 font-display text-xs font-bold text-white shadow-soft transition-all hover:shadow-[var(--shadow-glow)]">
            Upgrade plan
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="hidden w-[220px] shrink-0 self-start border-r border-ink-200 bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[220px] border-r border-ink-200 bg-sidebar">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200/70 bg-white/80 px-5 py-4 backdrop-blur-md sm:px-8">
          <button
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden flex-col lg:flex">
            <p className="font-display text-lg font-bold text-ink-900">
              {user?.companyName ?? 'Your Organization'}
            </p>
            <p className="text-sm text-ink-400">CEO Dashboard</p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <NotificationBell />

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-ink-100"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-b from-brand-100 to-brand-200 font-display text-sm font-bold text-brand-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  {initials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold text-ink-900">{user?.name}</span>
                  <span className="block text-xs text-ink-400">{user?.role}</span>
                </span>
                <ChevronDown className="hidden size-4 text-ink-400 sm:block" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl border border-ink-200/60 bg-white p-1.5 shadow-[var(--shadow-lift)]">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
                    <p className="truncate text-xs text-ink-400">{user?.email}</p>
                  </div>
                  <div className="my-1 h-px bg-ink-100" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#d03b3b] hover:bg-[#fbe9e9]"
                  >
                    <LogOut className="size-[16px]" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <div key={location.pathname} className="animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
