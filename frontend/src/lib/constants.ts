export const INDUSTRY_TYPES = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'INFORMATION_TECHNOLOGY', label: 'Information Technology' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'HOSPITALITY', label: 'Hospitality' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'LOGISTICS', label: 'Logistics' },
  { value: 'BANKING_FINANCE', label: 'Banking & Finance' },
  { value: 'FOOD_BEVERAGE', label: 'Food & Beverage' },
  { value: 'AUTOMOTIVE', label: 'Automotive' },
  { value: 'MEDIA_ENTERTAINMENT', label: 'Media & Entertainment' },
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'TELECOMMUNICATIONS', label: 'Telecommunications' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'PHARMACEUTICALS', label: 'Pharmaceuticals' },
  { value: 'ENERGY_UTILITIES', label: 'Energy & Utilities' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Professional Services' },
  { value: 'OTHER', label: 'Other' },
] as const

export type IndustryType = (typeof INDUSTRY_TYPES)[number]['value']

export const COUNTRIES = [
  'United Arab Emirates',
  'India',
  'United States',
  'United Kingdom',
  'Saudi Arabia',
  'Singapore',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'South Africa',
  'Nigeria',
  'Egypt',
  'Malaysia',
  'Indonesia',
  'Philippines',
  'Other',
] as const

export type Plan = 'STARTER' | 'GROW' | 'ENTERPRISE'

export const PLANS: {
  id: Plan
  name: string
  tagline: string
  price: string
  cadence: string
  features: string[]
  highlight?: boolean
}[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    tagline: 'For founders getting petty cash under control',
    price: 'Free',
    cadence: 'to begin',
    features: ['1 organization workspace', 'Up to 5 team members', 'Basic expense tracking', 'Email support'],
  },
  {
    id: 'GROW',
    name: 'Grow',
    tagline: 'For growing teams with multiple branches',
    price: '$49',
    cadence: '/ month',
    features: ['Up to 25 team members', 'Multi-branch petty cash', 'Approval workflows', 'Priority support'],
    highlight: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    tagline: 'For organizations that need full control',
    price: 'Custom',
    cadence: 'pricing',
    features: ['Unlimited team members', 'Custom approval chains', 'Dedicated account manager', 'SLA & audit logs'],
  },
]
