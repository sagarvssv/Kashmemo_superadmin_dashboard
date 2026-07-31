import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BadgeCheck, Coins, Loader2, Mail, Phone, ShieldCheck } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Field } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { extractErrorMessage } from '../../lib/api'
import { getProfile, type Profile } from '../../lib/employees'
import { CURRENCIES } from '../../lib/currency'
import { useCurrencyStore } from '../../store/currencyStore'
import { CopyableField } from '../../components/ui/CopyableField'

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const currencyCode = useCurrencyStore((state) => state.currencyCode)
  const setCurrencyCode = useCurrencyStore((state) => state.setCurrencyCode)

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const initials = (profile?.name ?? 'C E')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Settings</h1>
        <p className="mt-1 text-[15px] text-ink-500">Your account details.</p>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center gap-2.5 py-20 text-ink-400">
          <Loader2 className="size-5 animate-spin" />
          Loading profile…
        </Card>
      ) : error ? (
        <Card className="py-10 text-center text-[#d03b3b]">{error}</Card>
      ) : profile ? (
        <Card className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-100 font-display text-lg font-bold text-brand-800">
              {initials}
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink-900">{profile.name}</p>
              <p className="text-sm text-ink-500">{profile.designation}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3.5">
              <Mail className="size-[18px] text-brand-600" />
              <div>
                <p className="text-xs text-ink-400">Email</p>
                <p className="text-sm font-medium text-ink-800">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3.5">
              <Phone className="size-[18px] text-brand-600" />
              <div>
                <p className="text-xs text-ink-400">Phone</p>
                <p className="text-sm font-medium text-ink-800">{profile.phoneNumber ?? 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3.5">
              <ShieldCheck className="size-[18px] text-brand-600" />
              <div>
                <p className="text-xs text-ink-400">Role</p>
                <p className="text-sm font-medium text-ink-800">{profile.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3.5">
              <BadgeCheck className="size-[18px] text-brand-600" />
              <div>
                <p className="text-xs text-ink-400">Email verification</p>
                <p className="text-sm font-medium text-ink-800">
                  {profile.isEmailVerified ? 'Verified' : 'Not verified'}
                </p>
              </div>
            </div>
          </div>

          <CopyableField label="Organization ID" value={profile.organizationId} />
        </Card>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Coins className="size-[18px]" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">Preferences</h2>
            <p className="text-sm text-ink-500">Choose the currency used across your dashboard.</p>
          </div>
        </div>
        <Field label="Currency" htmlFor="currency" className="max-w-xs">
          <Select
            id="currency"
            value={currencyCode}
            onChange={(e) => {
              setCurrencyCode(e.target.value)
              toast.success('Currency updated.')
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>
    </div>
  )
}
