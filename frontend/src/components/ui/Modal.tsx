import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  // Body scroll lock — without this the page behind the overlay keeps
  // scrolling (and can lose/gain its scrollbar), which reads as a stray
  // second scrollbar / jitter while a modal is open.
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-ink-950/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className={`relative flex max-h-[85vh] w-full ${maxWidth} flex-col rounded-[22px] border border-ink-200/60 bg-white p-6 shadow-[var(--shadow-lift)]`}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
