import { create } from 'zustand'
import type { Notification } from '../lib/notifications'

interface NotificationState {
  items: Notification[]
  unreadCount: number
  loaded: boolean
  setItems: (items: Notification[]) => void
  setUnreadCount: (count: number) => void
  setLoaded: (loaded: boolean) => void
  prepend: (item: Notification) => void
  markReadLocal: (id: string) => void
  markAllReadLocal: () => void
  reset: () => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  items: [],
  unreadCount: 0,
  loaded: false,
  setItems: (items) => set({ items }),
  setLoaded: (loaded) => set({ loaded }),
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
  reset: () => set({ items: [], unreadCount: 0, loaded: false }),
}))
