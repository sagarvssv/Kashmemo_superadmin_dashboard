import { create } from 'zustand'
import type { Notification } from '../lib/notifications'

interface NotificationState {
  items: Notification[]
  unreadCount: number
  setItems: (items: Notification[]) => void
  setUnreadCount: (count: number) => void
  prepend: (item: Notification) => void
  markReadLocal: (id: string) => void
  markAllReadLocal: () => void
  reset: () => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  items: [],
  unreadCount: 0,
  setItems: (items) => set({ items }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  prepend: (item) =>
    set((state) => ({
      items: [item, ...state.items],
      unreadCount: item.isRead ? state.unreadCount : state.unreadCount + 1,
    })),
  markReadLocal: (id) =>
    set((state) => {
      const target = state.items.find((n) => n.id === id)
      if (!target || target.isRead) return state
      return {
        items: state.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    }),
  markAllReadLocal: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  reset: () => set({ items: [], unreadCount: 0 }),
}))
