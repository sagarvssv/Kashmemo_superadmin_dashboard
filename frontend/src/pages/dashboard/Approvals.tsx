import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Banknote, Check, ClipboardCheck, Eye, Loader2, X } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Field, controlClasses } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { CopyableField } from '../../components/ui/CopyableField'
import { extractErrorMessage } from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { useAuthStore } from '../../store/authStore'
import { useCurrencyStore } from '../../store/currencyStore'
import { approveTicket, disburseTicket, listTickets, rejectTicket, type Ticket, type TicketStatus } from '../../lib/tickets'
import { connectSocket } from '../../lib/socket'

const STATUS_FILTERS: Array<{ value: TicketStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIALLY_APPROVED', label: 'Partially approved' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DISBURSED', label: 'Disbursed' },
  { value: 'REJECTED', label: 'Rejected' },
]

const statusStyles: Record<TicketStatus, string> = {
  PENDING: 'bg-[#fef3de] text-[#9c6716]',
  PARTIALLY_APPROVED: 'bg-[#eaf1fd] text-[#2f5fb3]',
  APPROVED: 'bg-brand-100 text-brand-800',
  DISBURSED: 'bg-[#e3f6ec] text-[#1a8f5e]',
  REJECTED: 'bg-[#fbe9e9] text-[#d03b3b]',
}

const statusLabels: Record<TicketStatus, string> = {
  PENDING: 'Pending',
  PARTIALLY_APPROVED: 'Partially approved',
  APPROVED: 'Approved',
  DISBURSED: 'Disbursed',
  REJECTED: 'Rejected',
}

const LIMIT = 10

export default function Approvals() {
  const role = useAuthStore((state) => state.user?.role)
  const currencyCode = useCurrencyStore((state) => state.currencyCode)
  const canManage = role === 'CEO' || role === 'HR' || role === 'FINANCE_MANAGER'

  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const [viewTicket, setViewTicket] = useState<Ticket | null>(null)
  const [disburseTarget, setDisburseTarget] = useState<Ticket | null>(null)
  const [disbursing, setDisbursing] = useState(false)
  const [disburseIdentifier, setDisburseIdentifier] = useState('')
  const [disburseError, setDisburseError] = useState('')

  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Ticket | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')

  useEffect(() => {
    if (!canManage) return
    setLoading(true)
    listTickets({ status: statusFilter || undefined, limit: LIMIT })
      .then((res) => {
        setTickets(res.data)
        setNextCursor(res.nextCursor)
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [statusFilter, canManage])

  const statusFilterRef = useRef(statusFilter)
  statusFilterRef.current = statusFilter

  useEffect(() => {
    if (!canManage) return
    const socket = connectSocket()
    const handleStatusUpdate = (payload: { ticket: Ticket }) => {
      setTickets((prev) => prev.map((t) => (t.id === payload.ticket.id ? { ...t, ...payload.ticket } : t)))
    }
    const handleCreated = (payload: { ticket: Ticket }) => {
      const filter = statusFilterRef.current
      if (filter && filter !== payload.ticket.status) return
      setTickets((prev) => [payload.ticket, ...prev])
    }
    socket.on('ticket:status-update', handleStatusUpdate)
    socket.on('ticket:created', handleCreated)
    return () => {
      socket.off('ticket:status-update', handleStatusUpdate)
      socket.off('ticket:created', handleCreated)
    }
  }, [canManage])

  const handleLoadMore = () => {
    if (!nextCursor) return
    setLoadingMore(true)
    listTickets({ status: statusFilter || undefined, limit: LIMIT, cursor: nextCursor })
      .then((res) => {
        setTickets((prev) => [...prev, ...res.data])
        setNextCursor(res.nextCursor)
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoadingMore(false))
  }

  const openDisburse = (ticket: Ticket) => {
    setDisburseTarget(ticket)
    setDisburseIdentifier('')
    setDisburseError('')
  }

  const closeDisburse = () => {
    setDisburseTarget(null)
    setDisburseIdentifier('')
    setDisburseError('')
  }

  const handleDisburse = async () => {
    if (!disburseTarget) return
    const value = disburseIdentifier.trim()
    if (!value) {
      setDisburseError("Enter the recipient's email or phone number to confirm.")
      return
    }
    const identifier = value.includes('@') ? { email: value } : { phoneNumber: value }

    setDisbursing(true)
    try {
      const res = await disburseTicket(disburseTarget.id, identifier)
      setTickets((prev) => prev.map((t) => (t.id === res.data.id ? { ...t, ...res.data } : t)))
      toast.success('Ticket disbursed.')
      closeDisburse()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDisbursing(false)
    }
  }

  const handleApprove = async (ticket: Ticket) => {
    setApprovingId(ticket.id)
    try {
      const res = await approveTicket(ticket.id)
      setTickets((prev) => prev.map((t) => (t.id === res.data.id ? { ...t, ...res.data } : t)))
      toast.success(res.data.status === 'PARTIALLY_APPROVED' ? 'Ticket approved — waiting on final sign-off.' : 'Ticket approved.')
      setViewTicket((v) => (v && v.id === res.data.id ? { ...v, ...res.data } : v))
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setApprovingId(null)
    }
  }

  const openReject = (ticket: Ticket) => {
    setRejectTarget(ticket)
    setRejectReason('')
    setRejectError('')
  }

  const closeReject = () => {
    setRejectTarget(null)
    setRejectReason('')
    setRejectError('')
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    const reason = rejectReason.trim()
    if (!reason) {
      setRejectError('Enter a reason for rejecting this ticket.')
      return
    }

    setRejecting(true)
    try {
      const res = await rejectTicket(rejectTarget.id, reason)
      setTickets((prev) => prev.map((t) => (t.id === res.data.id ? { ...t, ...res.data } : t)))
      toast.success('Ticket rejected.')
      setViewTicket((v) => (v && v.id === res.data.id ? { ...v, ...res.data } : v))
      closeReject()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setRejecting(false)
    }
  }

  if (!canManage) {
    return (
      <Card className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_16px_-6px_rgba(12,111,69,0.55)]">
          <ClipboardCheck className="size-6" />
        </span>
        <h2 className="font-display text-lg font-bold text-ink-900">Restricted</h2>
        <p className="max-w-sm text-[15px] text-ink-500">Only the CEO, HR, or Finance Manager can review and disburse tickets.</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Approvals</h1>
        <p className="mt-1 text-[15px] text-ink-500">Review tickets and mark approved ones as disbursed.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
          className="max-w-[180px]"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-20 text-ink-400">
            <Loader2 className="size-5 animate-spin" />
            Loading tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_16px_-6px_rgba(12,111,69,0.55)]">
              <ClipboardCheck className="size-6" />
            </span>
            <h2 className="font-display text-lg font-bold text-ink-900">No tickets found</h2>
            <p className="max-w-sm text-[15px] text-ink-500">
              {statusFilter ? 'No tickets match this status.' : 'Tickets raised by the team will show up here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-y border-ink-100 bg-ink-50/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-6 py-3 font-semibold">Purpose</th>
                  <th className="px-6 py-3 font-semibold">Department</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Raised</th>
                  <th className="px-6 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-ink-100 transition-colors last:border-0 hover:bg-ink-50/60">
                    <td className="max-w-[220px] truncate px-6 py-3.5 text-sm font-medium text-ink-800" title={ticket.purpose}>
                      {ticket.purpose}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-ink-600">{ticket.department.name}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold tabular-nums text-ink-800">
                      {formatCurrency(ticket.amount, currencyCode)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-black/5 ${statusStyles[ticket.status]}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {statusLabels[ticket.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-ink-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setViewTicket(ticket)}
                          className="!px-3 !py-1.5 text-sm"
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>
                        {(ticket.status === 'PENDING' || ticket.status === 'PARTIALLY_APPROVED') && (
                          <>
                            <Button
                              variant="secondary"
                              onClick={() => handleApprove(ticket)}
                              loading={approvingId === ticket.id}
                              className="!px-3 !py-1.5 text-sm !text-[#1a8f5e] hover:!bg-[#e3f6ec]"
                            >
                              <Check className="size-3.5" />
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => openReject(ticket)}
                              className="!px-3 !py-1.5 text-sm !text-[#d03b3b] hover:!bg-[#fbe9e9]"
                            >
                              <X className="size-3.5" />
                              Reject
                            </Button>
                          </>
                        )}
                        {ticket.status === 'APPROVED' && (
                          <Button onClick={() => openDisburse(ticket)} className="!px-3 !py-1.5 text-sm">
                            <Banknote className="size-3.5" />
                            Disburse
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {nextCursor && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={handleLoadMore} loading={loadingMore}>
            Load more
          </Button>
        </div>
      )}

      <Modal open={!!viewTicket} onClose={() => setViewTicket(null)} title="Ticket details">
        {viewTicket && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-ink-400">Purpose</p>
              <p className="text-[15px] font-medium text-ink-800">{viewTicket.purpose}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ink-400">Department</p>
                <p className="text-sm font-medium text-ink-800">{viewTicket.department.name}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Amount</p>
                <p className="text-sm font-semibold text-ink-800">{formatCurrency(viewTicket.amount, currencyCode)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Status</p>
                <span
                  className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-black/5 ${statusStyles[viewTicket.status]}`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {statusLabels[viewTicket.status]}
                </span>
              </div>
              <div>
                <p className="text-xs text-ink-400">Raised on</p>
                <p className="text-sm font-medium text-ink-800">{new Date(viewTicket.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {viewTicket.status === 'REJECTED' && viewTicket.rejectionReason && (
              <div className="rounded-xl border border-[#f5d5d5] bg-[#fbe9e9] px-4 py-3">
                <p className="text-xs font-semibold text-[#d03b3b]">Rejection reason</p>
                <p className="mt-0.5 text-sm text-[#9c2b2b]">{viewTicket.rejectionReason}</p>
              </div>
            )}

            {viewTicket.disbursedAt && (
              <p className="text-sm text-ink-500">
                Disbursed on {new Date(viewTicket.disbursedAt).toLocaleString()}
              </p>
            )}

            <CopyableField label="Ticket ID" value={viewTicket.id} />
            <CopyableField label="Raised by (User ID)" value={viewTicket.raisedBy} />

            {viewTicket.status === 'APPROVED' && (
              <div className="mt-2 flex justify-end">
                <Button
                  onClick={() => {
                    openDisburse(viewTicket)
                    setViewTicket(null)
                  }}
                >
                  <Banknote className="size-4" />
                  Disburse ticket
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!disburseTarget} onClose={closeDisburse} title="Disburse ticket" maxWidth="max-w-sm">
        <p className="text-[15px] text-ink-500">
          Mark "{disburseTarget?.purpose ?? ''}" (
          {disburseTarget ? formatCurrency(disburseTarget.amount, currencyCode) : ''}) as disbursed? This can't be
          undone.
        </p>
        <Field
          label="Recipient's email or phone number"
          htmlFor="disburse-identifier"
          error={disburseError}
          className="mt-4"
        >
          <Input
            id="disburse-identifier"
            value={disburseIdentifier}
            onChange={(e) => {
              setDisburseIdentifier(e.target.value)
              setDisburseError('')
            }}
            placeholder="e.g. jane@company.com or 9876543210"
            hasError={!!disburseError}
          />
        </Field>
        <p className="mt-1.5 text-xs text-ink-400">
          Used to confirm the payout goes to the employee who raised this ticket.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={closeDisburse} disabled={disbursing}>
            Cancel
          </Button>
          <Button onClick={handleDisburse} loading={disbursing}>
            Disburse
          </Button>
        </div>
      </Modal>

      <Modal open={!!rejectTarget} onClose={closeReject} title="Reject ticket" maxWidth="max-w-sm">
        <p className="text-[15px] text-ink-500">
          Reject "{rejectTarget?.purpose ?? ''}" (
          {rejectTarget ? formatCurrency(rejectTarget.amount, currencyCode) : ''})? This can't be undone.
        </p>
        <Field label="Reason for rejection" htmlFor="reject-reason" error={rejectError} className="mt-4">
          <textarea
            id="reject-reason"
            rows={3}
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value)
              setRejectError('')
            }}
            placeholder="Let the requester know why this was rejected"
            className={controlClasses(!!rejectError) + ' resize-none'}
          />
        </Field>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={closeReject} disabled={rejecting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReject} loading={rejecting}>
            Reject ticket
          </Button>
        </div>
      </Modal>
    </div>
  )
}
