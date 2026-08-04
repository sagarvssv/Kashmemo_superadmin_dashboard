export interface ActivityLogEntry {
  id: string
  organizationId: string
  departmentId: string | null
  type: string
  message: string
  actorId: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}
