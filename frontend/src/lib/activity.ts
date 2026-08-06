import { api } from './api'

export interface ActivityLogEntry {
  id: string
  organizationId: string
  departmentId: string | null
  type: string
  message: string
  actorId: string
  metadata?: Record<string, unknown> | null
  createdAt: string
  actor?: { id: string; name: string; email: string } | null
}

export interface ListRecentActivitiesParams {
  limit?: number
  cursor?: string
}

interface ListRecentActivitiesResult {
  success: boolean
  data: ActivityLogEntry[]
  nextCursor: string | null
}

export function listRecentActivities(params: ListRecentActivitiesParams = {}) {
  return api
    .get<ListRecentActivitiesResult>('/dashboard/recent-activities', { params })
    .then((res) => res.data)
}
