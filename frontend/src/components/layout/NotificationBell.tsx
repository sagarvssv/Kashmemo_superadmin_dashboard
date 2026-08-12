import { useEffect, useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { connectSocket } from '../../lib/socket'
import { extractErrorMessage } from '../../lib/api'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '../../lib/notifications'
import { useNotificationStore } from '../../store/notificationStore'
import { useAuthStore } from '../../store/authStore'
import { formatRelativeTime } from '../../lib/format'

interface TicketNotificationPayload {
  ticket: { id: string; departmentId: string; purpose: string; amount: number | string }
  message: string
  timestamp: string
}

export function NotificationBell() {
  const departmentId = useAuthStore((state) => state.user?.departmentId)
  const items = useNotificationStore((state) => state.items)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const setItems = useNotificationStore((state) => state.setItems)
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount)
  const prepend = useNotificationStore((state) => state.prepend)
  const markReadLocal = useNotificationStore((state) => state.markReadLocal)
  const markAllReadLocal = useNotificationStore((state) => state.markAllReadLocal)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getUnreadNotificationCount()
      .then((res) => setUnreadCount(res.data))
      .catch(() => {})
  }, [setUnreadCount])

  // connectSocket() is idempotent — DashboardLayout owns connect/disconnect
  // for the session lifecycle, this just attaches the live-update listener.
  useEffect(() => {
    const socket = connectSocket()
    const handleNotification = (notification: Notification) => {
      prepend(notification)
      toast(notification.message, { icon: '🔔' })
    }
    socket.on('notification', handleNotification)
    return () => {
      socket.off('notification', handleNotification)
    }
  }, [prepend])

  // New-ticket alerts arrive on a separate live-only event (not persisted via
  // createNotification, so it won't reappear from GET /notifications after a
  // refresh) — it's broadcast to every MANAGER/CEO/HR in the org, so filter
  // to this manager's own department.
  useEffect(() => {
    const socket = connectSocket()
    const handleTicketNotification = (payload: TicketNotificationPayload) => {
      if (payload.ticket.departmentId !== departmentId) return
      prepend({
        id: `live-ticket-${payload.ticket.id}-${payload.timestamp}`,
        organizationId: '',
        departmentId: payload.ticket.departmentId,
        userId: '',
        type: 'TICKET_RAISED',
        message: payload.message,
        metadata: { ticketId: payload.ticket.id, purpose: payload.ticket.purpose, amount: payload.ticket.amount },
        isRead: false,
        createdAt: payload.timestamp,
      })
      toast(payload.message, { icon: '🧾' })
    }
    socket.on('ticket:notification', handleTicketNotification)
    return () => {
      socket.off('ticket:notification', handleTicketNotification)
    }
  }, [prepend, departmentId])

  const fetchNotifications = () => {
    setLoading(true)
    getNotifications({ limit: 15 })
      .then((res) => {
        setItems(res.data)
        setLoaded(true)
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  const handleToggle = () => {
    setOpen((o) => {
      const next = !o
      if (next && !loaded) fetchNotifications()
      return next
    })
  }

  const handleItemClick = (notification: Notification) => {
    if (notification.isRead) return
    markReadLocal(notification.id)
    markNotificationRead(notification.id).catch(() => {})
  }

  const handleMarkAllRead = () => {
    markAllReadLocal()
    markAllNotificationsRead().catch(() => {})
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative rounded-full p-2.5 text-ink-500 hover:bg-ink-100"
        aria-label="Notifications"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-[#d03b3b] px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-ink-200 bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <p className="font-display text-sm font-bold text-ink-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-ink-400">
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-ink-400">No notifications yet.</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`flex w-full flex-col items-start gap-1 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50 ${
                      n.isRead ? '' : 'bg-brand-50/60'
                    }`}
                  >
                    <div className="flex w-full items-start gap-2">
                      {!n.isRead && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-600" />}
                      <p className={`text-sm ${n.isRead ? 'text-ink-600' : 'font-medium text-ink-900'}`}>
                        {n.message}
                      </p>
                    </div>
                    <p className="pl-3.5 text-xs text-ink-400">{formatRelativeTime(n.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
