import { api } from './api'

export interface Notification {
  id: string
  organizationId: string
  departmentId: string | null
  userId: string
  type: string
  message: string
  metadata?: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

export interface ListNotificationsParams {
  limit?: number
  cursor?: string
  unreadOnly?: boolean
}

interface ListNotificationsResult {
  status: string
  data: Notification[]
  nextCursor: string | null
}

export function getNotifications(params: ListNotificationsParams = {}) {
  return api
    .get<{ status: string; data: Notification[]; nextCursor: string | null }>('/notifications', { params })
    .then((res) => res.data)
}

export function listNotifications(params: ListNotificationsParams = {}) {
  return api.get<ListNotificationsResult>('/notifications', { params }).then((res) => res.data)
}

export function getUnreadNotificationCount() {
  return api.get<{ status: string; data: number }>('/notifications/unread-count').then((res) => res.data)
}

export function markNotificationRead(notificationId: string) {
  return api
    .patch<{ status: string; data: Notification }>(`/notifications/mark-read/${notificationId}`)
    .then((res) => res.data)
}

export function markAllNotificationsRead() {
  return api
    .patch<{ status: string; data: { count: number } }>('/notifications/mark-all-read')
    .then((res) => res.data)
}
