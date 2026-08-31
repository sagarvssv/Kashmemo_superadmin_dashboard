import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
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
    <div className="relative flex h-full flex-col">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl"
        aria-hidden
      />
      <div className="relative shrink-0">
        <div className="px-6 pb-8 pt-7">
          <Logo mark="light" />
        </div>
        <nav className="flex flex-col gap-1 px-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-brand-200/80 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-brand-300 to-gold-300 transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span
                    className={clsx(
                      'flex size-8 items-center justify-center rounded-lg transition-colors',
                      isActive ? 'bg-white/10 text-white' : 'text-brand-200/80 group-hover:text-white',
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="relative mt-5 flex min-h-0 flex-1 flex-col px-4">
        <div className="flex shrink-0 items-center gap-2 px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-brand-200/60">
          <Bell className="size-3.5" />
          Notifications
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.04]">
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-brand-200/60">You're all caught up.</p>
          ) : (
            <div className="flex flex-col py-1">
              {notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.isRead)}
                  className={clsx(
                    'flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]',
                    !n.isRead && 'bg-white/[0.04]',
                  )}
                >
                  <span
                    className={clsx(
                      'mt-1.5 size-1.5 shrink-0 rounded-full',
                      n.isRead ? 'bg-transparent' : 'bg-gold-300 shadow-[0_0_0_3px_rgba(233,185,79,0.18)]',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={clsx(
                        'line-clamp-2 text-[13px] leading-snug',
                        n.isRead ? 'text-brand-200/70' : 'font-medium text-white',
                      )}
                    >
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-brand-200/50">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative m-4 shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] p-4">
        <p className="font-display text-sm font-bold text-white">
          {planLabel[user?.plan ?? 'STARTER']}
        </p>
        <p className="mt-1 text-xs text-brand-200/80">
          {user?.plan === 'ENTERPRISE'
            ? 'You have full access to every feature.'
            : 'Upgrade to unlock more team seats & workflows.'}
        </p>
        {user?.plan !== 'ENTERPRISE' && (
          <button className="mt-3 w-full rounded-lg bg-gradient-to-b from-gold-300 to-gold-400 px-3 py-2 font-display text-xs font-bold text-ink-900 shadow-[0_4px_14px_-4px_rgba(220,159,44,0.6)] transition-all hover:shadow-[0_6px_18px_-4px_rgba(220,159,44,0.75)]">
            Upgrade plan
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="relative hidden w-[260px] shrink-0 overflow-hidden bg-gradient-to-b from-ink-950 via-brand-950 to-ink-950 shadow-[var(--shadow-sidebar)] lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] overflow-hidden bg-gradient-to-b from-ink-950 via-brand-950 to-ink-950">
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
