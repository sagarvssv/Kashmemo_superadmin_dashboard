import { api } from './api'

export type TicketStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED'

export interface Ticket {
  id: string
  organizationId: string
  departmentId: string
  department: { name: string }
  raisedBy: string
  purpose: string
  amount: number | string
  status: TicketStatus
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  disbursedBy: string | null
  disbursedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ListTicketsParams {
  status?: TicketStatus
  cursor?: string
  limit?: number
}

export interface ListTicketsResult {
  status: string
  data: Ticket[]
  nextCursor: string | null
}

export function listTickets(params: ListTicketsParams = {}) {
  return api.get<ListTicketsResult>('/ticket/list-tickets', { params }).then((res) => res.data)
}

export function getTicketById(ticketId: string) {
  return api.get<{ status: string; data: Ticket }>(`/ticket/${ticketId}`).then((res) => res.data)
}

export interface DisburseIdentifier {
  phoneNumber?: string
  email?: string
}

export function disburseTicket(ticketId: string, identifier: DisburseIdentifier) {
  return api
    .patch<{ status: string; data: Ticket }>(`/ticket/disburse-ticket/${ticketId}`, identifier)
    .then((res) => res.data)
}
