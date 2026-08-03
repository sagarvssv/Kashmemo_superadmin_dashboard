import { api } from './api'
import type { Ticket } from './tickets'

export interface DashboardSummary {
  month: number
  year: number
  totalEmployees: number
  totalDepartments: number
  budget: {
    totalAllocatedBudget: number
    totalSpent: number
    totalRemaining: number
  }
  tickets: {
    PENDING: number
    APPROVED: number
    DISBURSED: number
    REJECTED: number
  }
}

export function getDashboardSummary(month: number, year: number) {
  return api
    .get<{ status: string; data: DashboardSummary }>('/dashboard/summary', { params: { month, year } })
    .then((res) => res.data)
}

export function getCeoPendingTickets() {
  return api.get<{ status: string; data: Ticket[] }>('/dashboard/pending-tickets').then((res) => res.data)
}
