import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Wallet,
  ClipboardCheck,
  ReceiptText,
  BarChart3,
  Users,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
} from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '../ui/Logo'
import { useAuthStore } from '../../store/authStore'
import { logoutRequest } from '../../lib/api'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutGrid
  end?: boolean
}

const baseNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/dashboard/petty-cash', label: 'Petty Cash', icon: Wallet },
  { to: '/dashboard/approvals', label: 'Approvals', icon: ClipboardCheck },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { to: '/dashboard/team', label: 'Team', icon: Users },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const ticketsNavItem: NavItem = { to: '/dashboard/tickets', label: 'Tickets', icon: ReceiptText }

const planLabel: Record<string, string> = {
  STARTER: 'Starter plan',
  GROW: 'Grow plan',
  ENTERPRISE: 'Enterprise plan',
}

export function DashboardLayout() {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const canManageTickets = user?.role === 'CEO' || user?.role === 'HR'
  const navItems = canManageTickets
    ? [...baseNavItems.slice(0, 2), ticketsNavItem, ...baseNavItems.slice(2)]
    : baseNavItems

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
    <div className="flex h-full flex-col justify-between">
      <div>
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
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors',
                  isActive ? 'bg-white/10 text-white' : 'text-brand-200 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="m-4 rounded-2xl bg-white/[0.06] p-4">
        <p className="font-display text-sm font-bold text-white">
          {planLabel[user?.plan ?? 'STARTER']}
        </p>
        <p className="mt-1 text-xs text-brand-200">
          {user?.plan === 'ENTERPRISE'
            ? 'You have full access to every feature.'
            : 'Upgrade to unlock more team seats & workflows.'}
        </p>
        {user?.plan !== 'ENTERPRISE' && (
          <button className="mt-3 w-full rounded-lg bg-gold-400 px-3 py-2 font-display text-xs font-bold text-ink-900 transition-colors hover:bg-gold-300">
            Upgrade plan
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="hidden w-[260px] shrink-0 bg-gradient-to-b from-brand-900 to-brand-950 lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] bg-gradient-to-b from-brand-900 to-brand-950">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-200/70 bg-white px-5 py-4 sm:px-8">
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
            <button className="relative rounded-full p-2.5 text-ink-500 hover:bg-ink-100">
              <Bell className="size-[18px]" />
              <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-gold-400" />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-ink-100"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 font-display text-sm font-bold text-brand-800">
                  {initials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold text-ink-900">{user?.name}</span>
                  <span className="block text-xs text-ink-400">{user?.role}</span>
                </span>
                <ChevronDown className="hidden size-4 text-ink-400 sm:block" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-ink-200 bg-white p-1.5 shadow-lift">
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
          <Outlet />
        </main>
      </div>
    </div>
  )
}
