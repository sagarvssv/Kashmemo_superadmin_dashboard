import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_CURRENCY } from '../lib/currency'

interface CurrencyState {
  currencyCode: string
  setCurrencyCode: (code: string) => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currencyCode: DEFAULT_CURRENCY,
      setCurrencyCode: (currencyCode) => set({ currencyCode }),
    }),
    { name: 'kashmemo-currency' },
  ),
)
