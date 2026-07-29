export interface CurrencyOption {
  code: string
  label: string
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'SAR', label: 'Saudi Riyal (SAR)' },
  { code: 'QAR', label: 'Qatari Riyal (QAR)' },
  { code: 'KWD', label: 'Kuwaiti Dinar (KWD)' },
  { code: 'BHD', label: 'Bahraini Dinar (BHD)' },
  { code: 'OMR', label: 'Omani Rial (OMR)' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
]

export const DEFAULT_CURRENCY = 'INR'
