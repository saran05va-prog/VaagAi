import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore, type Language, type ThemeMode, type DateFormat, type UnitSystem } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'
import { useFarmStore } from '../components/farm3d/farmStore'
import {
  User, Shield, Palette, Bell, Sprout, CreditCard, Code2, Database,
  HelpCircle, Info, FileText, Check, ChevronRight, Copy, Trash2, Plus,
  Moon, Sun, Monitor, Globe, Clock, Ruler, LogOut, AlertTriangle,
  Download, Upload, Mail, MessageSquare, ExternalLink, Lock, Smartphone,
  Key, Zap, Eye, EyeOff,
} from 'lucide-react'

type Section = 'profile' | 'security' | 'appearance' | 'notifications' | 'farm' | 'billing' | 'api' | 'data' | 'help' | 'about' | 'terms'

const SECTIONS: { id: Section; label: string; icon: typeof User; group: string }[] = [
  { id: 'profile', label: 'Profile', icon: User, group: 'Account' },
  { id: 'security', label: 'Security', icon: Shield, group: 'Account' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'Account' },
  { id: 'appearance', label: 'Appearance', icon: Palette, group: 'Preferences' },
  { id: 'farm', label: 'Farm Preferences', icon: Sprout, group: 'Preferences' },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard, group: 'Account' },
  { id: 'api', label: 'API & Integrations', icon: Code2, group: 'Developer' },
  { id: 'data', label: 'Data & Privacy', icon: Database, group: 'Account' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, group: 'Support' },
  { id: 'about', label: 'About', icon: Info, group: 'Support' },
  { id: 'terms', label: 'Terms & Policies', icon: FileText, group: 'Support' },
]

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
]

const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'America/New_York', 'Europe/London', 'Australia/Sydney', 'Asia/Singapore']

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className="relative inline-flex h-7 w-11 shrink-0 items-center rounded-full transition-colors"
      style={{ background: checked ? '#10B981' : 'rgba(255,255,255,0.1)' }}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function Card({ children, title, desc }: { children: React.ReactNode; title?: string; desc?: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(123, 207, 137, 0.12)', background: 'rgba(255,255,255,0.015)' }}>
      {title && <h3 className="text-sm font-semibold mb-1" style={{ color: '#eefdf0' }}>{title}</h3>}
      {desc && <p className="text-xs mb-4" style={{ color: '#5a7a6a' }}>{desc}</p>}
      {children}
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: 'rgba(123, 207, 137, 0.06)' }}>
      <div className="flex-1 min-w-0 mr-4">
        <div className="text-sm font-medium" style={{ color: '#eefdf0' }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: '#5a7a6a' }}>{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-400/50"
      style={{ borderColor: 'rgba(123, 207, 137, 0.15)', background: 'rgba(255,255,255,0.03)', color: '#eefdf0' }} />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border px-3 py-2 text-sm outline-none cursor-pointer"
      style={{ borderColor: 'rgba(123, 207, 137, 0.15)', background: 'rgba(255,255,255,0.03)', color: '#eefdf0' }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-2xl"
      style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
      <Check size={16} />
      <span className="text-sm font-medium">{msg}</span>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const { farmName } = useFarmStore()
  const s = useSettingsStore()
  const [active, setActive] = useState<Section>('profile')
  const [toast, setToast] = useState('')
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)

  const flash = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2500)
  }

  const groups = SECTIONS.reduce((acc, sec) => {
    if (!acc[sec.group]) acc[sec.group] = []
    acc[sec.group].push(sec)
    return acc
  }, {} as Record<string, typeof SECTIONS>)

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    flash('Copied to clipboard')
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleExport = () => {
    const data = JSON.stringify({ profile: s.profile, settings: { theme: s.theme, language: s.language, unitSystem: s.unitSystem, notifications: s.notifications }, farm: useFarmStore.getState().crops, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vaagai-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('Data exported successfully')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: 'calc(100vh - var(--topbar-height))' }}>
      <aside className="lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-4 rounded-2xl border p-3" style={{ borderColor: 'rgba(123, 207, 137, 0.12)', background: 'rgba(255,255,255,0.015)' }}>
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-3 last:mb-0">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#5a7a6a' }}>{group}</div>
              {items.map((sec) => {
                const isActive = active === sec.id
                const Icon = sec.icon
                return (
                  <button key={sec.id} onClick={() => setActive(sec.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                    style={{
                      background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      color: isActive ? '#7bf1a8' : '#95be9f',
                    }}>
                    <Icon size={16} />
                    {sec.label}
                    {isActive && <ChevronRight size={14} className="ml-auto" />}
                  </button>
                )
              })}
            </div>
          ))}
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(123, 207, 137, 0.08)' }}>
            <button onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-red-500/10"
              style={{ color: '#fca5a5' }}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 max-w-3xl">
        {active === 'profile' && (
          <SectionWrap title="Profile" desc="Manage your personal information and farm details">
            <Card title="Avatar" desc="Your profile picture appears across the platform">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #7bf1a8, #2e7d32)', color: 'white' }}>
                  {(s.profile.firstName[0] || 'F') + (s.profile.lastName[0] || '')}
                </div>
                <div>
                  <button className="px-4 py-2 rounded-xl text-xs font-medium border transition-colors hover:border-emerald-400/50"
                    style={{ borderColor: 'rgba(123, 207, 137, 0.2)', color: '#eefdf0' }}>
                    Upload Photo
                  </button>
                  <p className="text-[11px] mt-1.5" style={{ color: '#5a7a6a' }}>JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
            </Card>

            <Card title="Personal Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>First Name</label>
                  <Input value={s.profile.firstName} onChange={(v) => s.setProfile({ firstName: v })} placeholder="First name" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Last Name</label>
                  <Input value={s.profile.lastName} onChange={(v) => s.setProfile({ lastName: v })} placeholder="Last name" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Email Address</label>
                  <Input value={s.profile.email} onChange={(v) => s.setProfile({ email: v })} placeholder="you@example.com" type="email" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Phone Number</label>
                  <Input value={s.profile.phone} onChange={(v) => s.setProfile({ phone: v })} placeholder="Phone number" />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Farm Name</label>
                <Input value={s.profile.farmName} onChange={(v) => s.setProfile({ farmName: v })} placeholder="Your farm name" />
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Location</label>
                <Input value={s.profile.location} onChange={(v) => s.setProfile({ location: v })} placeholder="City, State, Country" />
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Total Area (hectares)</label>
                <Input value={String(s.profile.totalArea || '')} onChange={(v) => s.setProfile({ totalArea: parseFloat(v) || 0 })} placeholder="e.g. 5.5" type="number" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Bio</label>
                <textarea value={s.profile.bio} onChange={(e) => s.setProfile({ bio: e.target.value })} placeholder="Tell us about your farm..."
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-400/50 resize-none"
                  style={{ borderColor: 'rgba(123, 207, 137, 0.15)', background: 'rgba(255,255,255,0.03)', color: '#eefdf0' }} />
              </div>
            </Card>

            <SaveBar onSave={() => flash('Profile updated successfully')} />
          </SectionWrap>
        )}

        {active === 'security' && (
          <SectionWrap title="Security" desc="Protect your account with strong security settings">
            <Card title="Change Password" desc="Use a strong password with at least 8 characters">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Current Password</label>
                  <Input value={oldPass} onChange={setOldPass} placeholder="Enter current password" type="password" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>New Password</label>
                  <Input value={newPass} onChange={setNewPass} placeholder="Enter new password" type="password" />
                </div>
                <button onClick={() => { setOldPass(''); setNewPass(''); flash('Password updated successfully') }}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#7bf1a8' }}>
                  Update Password
                </button>
              </div>
            </Card>

            <Card title="Two-Factor Authentication" desc="Add an extra layer of security to your account">
              <Row label="Authenticator App" desc="Use Google Authenticator or similar TOTP app">
                <Toggle checked={s.security.twoFactorEnabled} onChange={() => { s.setSecurity({ twoFactorEnabled: !s.security.twoFactorEnabled }); flash(s.security.twoFactorEnabled ? '2FA disabled' : '2FA enabled') }} />
              </Row>
              {s.security.twoFactorEnabled && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.06)' }}>
                  <Smartphone size={14} style={{ color: '#10B981' }} />
                  <span className="text-xs" style={{ color: '#95be9f' }}>Scan QR code in your authenticator app to set up</span>
                </div>
              )}
            </Card>

            <Card title="Session Security">
              <Row label="Login Alerts" desc="Get notified when someone logs into your account">
                <Toggle checked={s.security.loginAlerts} onChange={() => s.setSecurity({ loginAlerts: !s.security.loginAlerts })} />
              </Row>
              <Row label="Session Timeout" desc="Automatically log out after inactivity">
                <Select value={String(s.security.sessionTimeout)} onChange={(v) => s.setSecurity({ sessionTimeout: parseInt(v) })}
                  options={[{ value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }, { value: '60', label: '1 hour' }, { value: '120', label: '2 hours' }, { value: '0', label: 'Never' }]} />
              </Row>
            </Card>

            <Card title="Active Sessions" desc="Devices currently logged into your account">
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.06)' }}>
                  <Monitor size={18} style={{ color: '#10B981' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: '#eefdf0' }}>Current Session</div>
                    <div className="text-[11px]" style={{ color: '#5a7a6a' }}>Chrome · Windows · Coimbatore, IN</div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#7bf1a8' }}>Active</span>
                </div>
              </div>
            </Card>

            <Card title="Danger Zone" desc="Irreversible actions — proceed with caution">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.06)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#fca5a5' }}>Delete Account</div>
                  <div className="text-xs mt-0.5" style={{ color: '#7a5a5a' }}>Permanently delete your account and all farm data</div>
                </div>
                <button className="px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-red-500/20"
                  style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5' }}>
                  Delete
                </button>
              </div>
            </Card>
          </SectionWrap>
        )}

        {active === 'appearance' && (
          <SectionWrap title="Appearance" desc="Customize how VaagAi looks on your device">
            <Card title="Theme" desc="Choose your preferred color scheme">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]] as [ThemeMode, string, typeof Sun][]).map(([mode, label, Icon]) => (
                  <button key={mode} onClick={() => { s.setTheme(mode); flash('Theme updated') }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
                    style={{
                      borderColor: s.theme === mode ? 'rgba(16, 185, 129, 0.5)' : 'rgba(123, 207, 137, 0.12)',
                      background: s.theme === mode ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                    }}>
                    <Icon size={20} style={{ color: s.theme === mode ? '#7bf1a8' : '#5a7a6a' }} />
                    <span className="text-xs font-medium" style={{ color: s.theme === mode ? '#7bf1a8' : '#95be9f' }}>{label}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Language" desc="Select your preferred language for the interface">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGES.map((lang) => (
                  <button key={lang.code} onClick={() => { s.setLanguage(lang.code); flash('Language updated') }}
                    className="flex items-center gap-2 p-3 rounded-xl border transition-all"
                    style={{
                      borderColor: s.language === lang.code ? 'rgba(16, 185, 129, 0.5)' : 'rgba(123, 207, 137, 0.12)',
                      background: s.language === lang.code ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                    }}>
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-xs font-medium" style={{ color: s.language === lang.code ? '#7bf1a8' : '#95be9f' }}>{lang.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Regional Preferences">
              <Row label="Timezone" desc="Used for calendar and task scheduling">
                <div className="flex items-center gap-2">
                  <Globe size={14} style={{ color: '#5a7a6a' }} />
                  <Select value={s.timezone} onChange={(v) => s.setTimezone(v)}
                    options={TIMEZONES.map((tz) => ({ value: tz, label: tz.replace('_', ' ') }))} />
                </div>
              </Row>
              <Row label="Date Format" desc="How dates are displayed across the app">
                <Select value={s.dateFormat} onChange={(v) => s.setDateFormat(v as DateFormat)}
                  options={[{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]} />
              </Row>
            </Card>
          </SectionWrap>
        )}

        {active === 'notifications' && (
          <SectionWrap title="Notifications" desc="Control what alerts you receive and how">
            <Card title="Delivery Channels" desc="Choose how you want to be notified">
              <Row label="Email Alerts" desc="Receive notifications via email">
                <Toggle checked={s.notifications.emailAlerts} onChange={() => s.setNotifications({ emailAlerts: !s.notifications.emailAlerts })} />
              </Row>
              <Row label="Push Notifications" desc="Browser and mobile push notifications">
                <Toggle checked={s.notifications.pushNotifications} onChange={() => s.setNotifications({ pushNotifications: !s.notifications.pushNotifications })} />
              </Row>
              <Row label="SMS Alerts" desc="Text messages for critical alerts (charges may apply)">
                <Toggle checked={s.notifications.smsAlerts} onChange={() => s.setNotifications({ smsAlerts: !s.notifications.smsAlerts })} />
              </Row>
            </Card>

            <Card title="Alert Types" desc="Pick which events trigger notifications">
              <Row label="Weather Alerts" desc="Storm warnings, frost, heavy rain">
                <Toggle checked={s.notifications.weatherAlerts} onChange={() => s.setNotifications({ weatherAlerts: !s.notifications.weatherAlerts })} />
              </Row>
              <Row label="Pest & Disease Alerts" desc="AI-detected threats to your crops">
                <Toggle checked={s.notifications.pestAlerts} onChange={() => s.setNotifications({ pestAlerts: !s.notifications.pestAlerts })} />
              </Row>
              <Row label="Harvest Reminders" desc="When crops are ready for harvest">
                <Toggle checked={s.notifications.harvestReminders} onChange={() => s.setNotifications({ harvestReminders: !s.notifications.harvestReminders })} />
              </Row>
              <Row label="Task Reminders" desc="Daily task schedule and overdue alerts">
                <Toggle checked={s.notifications.taskReminders} onChange={() => s.setNotifications({ taskReminders: !s.notifications.taskReminders })} />
              </Row>
              <Row label="Market Price Updates" desc="Price changes for your tracked crops">
                <Toggle checked={s.notifications.marketUpdates} onChange={() => s.setNotifications({ marketUpdates: !s.notifications.marketUpdates })} />
              </Row>
            </Card>

            <Card title="Reports & Updates">
              <Row label="Weekly Farm Report" desc="Summary of your farm's performance every Monday">
                <Toggle checked={s.notifications.weeklyReport} onChange={() => s.setNotifications({ weeklyReport: !s.notifications.weeklyReport })} />
              </Row>
              <Row label="Product Updates" desc="New features and improvements to VaagAi">
                <Toggle checked={s.notifications.productUpdates} onChange={() => s.setNotifications({ productUpdates: !s.notifications.productUpdates })} />
              </Row>
            </Card>

            <SaveBar onSave={() => flash('Notification preferences saved')} />
          </SectionWrap>
        )}

        {active === 'farm' && (
          <SectionWrap title="Farm Preferences" desc="Configure defaults for your farming operations">
            <Card title="Measurement Units" desc="Choose your preferred measurement system">
              <div className="grid grid-cols-2 gap-3">
                {([['metric', 'Metric', 'kg, ha, °C, cm'], ['imperial', 'Imperial', 'lb, acre, °F, in']] as [UnitSystem, string, string][]).map(([sys, label, units]) => (
                  <button key={sys} onClick={() => { s.setUnitSystem(sys); flash('Unit system updated') }}
                    className="flex flex-col items-start gap-1 p-4 rounded-xl border transition-all text-left"
                    style={{
                      borderColor: s.unitSystem === sys ? 'rgba(16, 185, 129, 0.5)' : 'rgba(123, 207, 137, 0.12)',
                      background: s.unitSystem === sys ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                    }}>
                    <div className="flex items-center gap-2">
                      <Ruler size={16} style={{ color: s.unitSystem === sys ? '#7bf1a8' : '#5a7a6a' }} />
                      <span className="text-sm font-medium" style={{ color: s.unitSystem === sys ? '#7bf1a8' : '#95be9f' }}>{label}</span>
                    </div>
                    <span className="text-[11px]" style={{ color: '#5a7a6a' }}>{units}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Farm Details" desc="Key information about your farm">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Farm Name</label>
                  <Input value={s.profile.farmName || farmName} onChange={(v) => s.setProfile({ farmName: v })} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Primary Location</label>
                  <Input value={s.profile.location} onChange={(v) => s.setProfile({ location: v })} placeholder="City, State, Country" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#95be9f' }}>Total Area (hectares)</label>
                  <Input value={String(s.profile.totalArea || '')} onChange={(v) => s.setProfile({ totalArea: parseFloat(v) || 0 })} placeholder="e.g. 5.5" type="number" />
                </div>
              </div>
            </Card>

            <Card title="Crop Calendar" desc="Default settings for crop planning">
              <Row label="Week Start Day" desc="First day of the week for calendar view">
                <Select value="0" onChange={() => {}} options={[{ value: '0', label: 'Sunday' }, { value: '1', label: 'Monday' }]} />
              </Row>
              <Row label="Growing Season Start" desc="Default month for new crop plans">
                <Select value="6" onChange={() => {}} options={[{ value: '1', label: 'January' }, { value: '6', label: 'June' }, { value: '7', label: 'July' }]} />
              </Row>
            </Card>

            <SaveBar onSave={() => flash('Farm preferences saved')} />
          </SectionWrap>
        )}

        {active === 'billing' && (
          <SectionWrap title="Billing & Plan" desc="Manage your subscription and payment methods">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: '#5a7a6a' }}>CURRENT PLAN</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold capitalize" style={{ color: '#eefdf0' }}>{s.plan}</span>
                    {s.plan === 'free' && <span className="text-sm" style={{ color: '#5a7a6a' }}>₹0/mo</span>}
                    {s.plan === 'pro' && <span className="text-sm" style={{ color: '#5a7a6a' }}>₹399/mo</span>}
                    {s.plan === 'enterprise' && <span className="text-sm" style={{ color: '#5a7a6a' }}>₹599/mo</span>}
                  </div>
                </div>
                {s.plan !== 'free' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#7bf1a8' }}>
                    <Zap size={12} /> Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { tier: 'free' as const, name: 'Free', price: '₹0', features: ['3D Farm View', 'Basic Weather', '5 Crop Plots', 'Community Support'] },
                  { tier: 'pro' as const, name: 'Pro', price: '₹399', features: ['Everything in Free', 'AI Crop Doctor', 'Unlimited Plots', 'Market Prices', 'Priority Support'] },
                  { tier: 'enterprise' as const, name: 'Enterprise', price: '₹599', features: ['Everything in Pro', 'API Access', 'Team Collaboration', 'Advanced Analytics', 'Dedicated Manager'] },
                ]).map((plan) => {
                  const current = s.plan === plan.tier
                  return (
                    <div key={plan.tier} className="rounded-xl border p-4 transition-all"
                      style={{ borderColor: current ? 'rgba(16, 185, 129, 0.5)' : 'rgba(123, 207, 137, 0.12)', background: current ? 'rgba(16, 185, 129, 0.04)' : 'transparent' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold" style={{ color: '#eefdf0' }}>{plan.name}</span>
                        {current && <Check size={16} style={{ color: '#10B981' }} />}
                      </div>
                      <div className="mb-3">
                        <span className="text-2xl font-bold" style={{ color: '#7bf1a8' }}>{plan.price}</span>
                        <span className="text-xs" style={{ color: '#5a7a6a' }}>/mo</span>
                      </div>
                      <ul className="space-y-1.5 mb-3">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-[11px]" style={{ color: '#95be9f' }}>
                            <Check size={12} style={{ color: '#10B981' }} /> {f}
                          </li>
                        ))}
                      </ul>
                      {!current && (
                        <button onClick={() => { s.setPlan(plan.tier); flash(`Upgraded to ${plan.name}!`) }}
                          className="w-full py-2 rounded-xl text-xs font-medium transition-colors"
                          style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#7bf1a8' }}>
                          Upgrade to {plan.name}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card title="Payment Method" desc="Your saved payment methods">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-10 h-7 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                  <CreditCard size={14} style={{ color: '#7bf1a8' }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: '#eefdf0' }}>•••• •••• •••• 4242</div>
                  <div className="text-[11px]" style={{ color: '#5a7a6a' }}>Expires 12/27 · Visa</div>
                </div>
                <button className="text-xs font-medium" style={{ color: '#7bf1a8' }}>Edit</button>
              </div>
              <button className="mt-3 flex items-center gap-2 text-xs font-medium" style={{ color: '#7bf1a8' }}>
                <Plus size={14} /> Add Payment Method
              </button>
            </Card>

            <Card title="Billing History" desc="Download your past invoices">
              <div className="space-y-2">
                {['Jul 2026', 'Jun 2026', 'May 2026'].map((month) => (
                  <div key={month} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-3">
                      <FileText size={14} style={{ color: '#5a7a6a' }} />
                      <span className="text-sm" style={{ color: '#eefdf0' }}>{month}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: '#5a7a6a' }}>₹399</span>
                      <button onClick={() => flash('Invoice downloaded')} className="text-xs font-medium" style={{ color: '#7bf1a8' }}>
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </SectionWrap>
        )}

        {active === 'api' && (
          <SectionWrap title="API & Integrations" desc="Connect VaagAi with your existing tools">
            <Card title="API Keys" desc="Generate keys to access VaagAi programmatically">
              {s.apiKeys.length > 0 && (
                <div className="space-y-2 mb-3">
                  {s.apiKeys.map((k) => (
                    <div key={k.id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium" style={{ color: '#eefdf0' }}>{k.name}</span>
                        <button onClick={() => { s.removeApiKey(k.id); flash('API key removed') }}>
                          <Trash2 size={14} style={{ color: '#fca5a5' }} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[11px] px-2 py-1.5 rounded-lg truncate font-mono" style={{ background: 'rgba(0,0,0,0.2)', color: '#95be9f' }}>
                          {showApiKey === k.id ? k.key : 'vai_••••••••••••••••••••••••••••••'}
                        </code>
                        <button onClick={() => setShowApiKey(showApiKey === k.id ? null : k.id)} className="p-1.5 rounded-lg">
                          {showApiKey === k.id ? <EyeOff size={14} style={{ color: '#5a7a6a' }} /> : <Eye size={14} style={{ color: '#5a7a6a' }} />}
                        </button>
                        <button onClick={() => copyText(k.key)} className="p-1.5 rounded-lg">
                          <Copy size={14} style={{ color: '#5a7a6a' }} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: '#5a7a6a' }}>
                        <span>Created: {k.created}</span>
                        <span>·</span>
                        <span>Last used: {k.lastUsed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input value={newKeyName} onChange={setNewKeyName} placeholder="Key name (e.g. Production)" />
                <button onClick={() => { if (newKeyName.trim()) { s.addApiKey(newKeyName.trim()); setNewKeyName(''); flash('API key generated') } }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium shrink-0"
                  style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#7bf1a8' }}>
                  <Plus size={14} /> Generate
                </button>
              </div>
            </Card>

            <Card title="Integrations" desc="Connect third-party services to VaagAi">
              <div className="space-y-2">
                {s.integrations.map((int) => (
                  <div key={int.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: int.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.04)' }}>
                      {int.type === 'weather' && <Globe size={16} style={{ color: int.connected ? '#7bf1a8' : '#5a7a6a' }} />}
                      {int.type === 'messaging' && <MessageSquare size={16} style={{ color: int.connected ? '#7bf1a8' : '#5a7a6a' }} />}
                      {int.type === 'export' && <FileText size={16} style={{ color: int.connected ? '#7bf1a8' : '#5a7a6a' }} />}
                      {int.type === 'market' && <Sprout size={16} style={{ color: int.connected ? '#7bf1a8' : '#5a7a6a' }} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: '#eefdf0' }}>{int.name}</div>
                      <div className="text-[11px] capitalize" style={{ color: '#5a7a6a' }}>{int.type}</div>
                    </div>
                    <button onClick={() => { s.toggleIntegration(int.id); flash(int.connected ? 'Integration disconnected' : 'Integration connected') }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${int.connected ? '' : ''}`}
                      style={{ background: int.connected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.12)', color: int.connected ? '#fca5a5' : '#7bf1a8' }}>
                      {int.connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Webhook URL" desc="Receive real-time events on your server">
              <div className="flex items-center gap-2">
                <Input value="" onChange={() => {}} placeholder="https://your-server.com/webhook" />
                <button onClick={() => flash('Webhook saved')} className="px-4 py-2 rounded-xl text-xs font-medium shrink-0"
                  style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#7bf1a8' }}>
                  Save
                </button>
              </div>
            </Card>
          </SectionWrap>
        )}

        {active === 'data' && (
          <SectionWrap title="Data & Privacy" desc="Control your data and privacy settings">
            <Card title="Data Export" desc="Download a copy of all your farm data">
              <p className="text-xs mb-3" style={{ color: '#5a7a6a' }}>
                Export your crop plots, task history, settings, and preferences as a JSON file. This includes all data stored locally and in the cloud.
              </p>
              <button onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors"
                style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#7bf1a8' }}>
                <Download size={14} /> Export All Data
              </button>
            </Card>

            <Card title="Data Import" desc="Restore data from a previously exported file">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#eefdf0' }}>
                <Upload size={14} />
                Choose File
                <input type="file" accept=".json" className="hidden" onChange={() => flash('Data imported successfully')} />
              </label>
            </Card>

            <Card title="Privacy Controls">
              <Row label="Analytics Tracking" desc="Help improve VaagAi by sharing anonymous usage data">
                <Toggle checked={true} onChange={() => {}} />
              </Row>
              <Row label="Personalized Recommendations" desc="Use your farm data to suggest crops and actions">
                <Toggle checked={true} onChange={() => {}} />
              </Row>
              <Row label="Show Farm on Leaderboard" desc="Display your farm stats on community rankings">
                <Toggle checked={false} onChange={() => {}} />
              </Row>
            </Card>

            <Card title="Data Retention" desc="Control how long your data is stored">
              <Row label="Task History" desc="Keep completed task records for">
                <Select value="365" onChange={() => {}} options={[{ value: '90', label: '90 days' }, { value: '180', label: '6 months' }, { value: '365', label: '1 year' }, { value: '0', label: 'Forever' }]} />
              </Row>
              <Row label="Sensor Data" desc="Retain sensor readings for">
                <Select value="180" onChange={() => {}} options={[{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }, { value: '180', label: '6 months' }, { value: '365', label: '1 year' }]} />
              </Row>
            </Card>

            <Card title="Clear Data" desc="Remove specific types of data from your account">
              <div className="space-y-2">
                {['Clear Task History', 'Clear Sensor Data', 'Clear Chat History', 'Clear All Cache'].map((action) => (
                  <div key={action} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-sm" style={{ color: '#eefdf0' }}>{action}</span>
                    <button onClick={() => flash('Data cleared')} className="text-xs font-medium" style={{ color: '#fca5a5' }}>
                      Clear
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </SectionWrap>
        )}

        {active === 'help' && (
          <SectionWrap title="Help & Support" desc="Get help and connect with the VaagAi community">
            <Card title="Quick Help">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: FileText, title: 'Documentation', desc: 'Guides and tutorials', action: () => flash('Opening docs...') },
                  { icon: MessageSquare, title: 'Contact Support', desc: 'Get help from our team', action: () => flash('Opening support chat...') },
                  { icon: Mail, title: 'Email Us', desc: 'support@vaagai.farm', action: () => flash('Opening email...') },
                  { icon: HelpCircle, title: 'FAQ', desc: 'Frequently asked questions', action: () => flash('Opening FAQ...') },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button key={item.title} onClick={item.action}
                      className="flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:border-emerald-400/30"
                      style={{ borderColor: 'rgba(123, 207, 137, 0.12)', background: 'rgba(255,255,255,0.015)' }}>
                      <Icon size={18} style={{ color: '#7bf1a8' }} />
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#eefdf0' }}>{item.title}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#5a7a6a' }}>{item.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card title="Send Feedback" desc="Help us improve VaagAi — share your thoughts">
              <textarea placeholder="What can we improve?" rows={4}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-400/50 resize-none mb-3"
                style={{ borderColor: 'rgba(123, 207, 137, 0.15)', background: 'rgba(255,255,255,0.03)', color: '#eefdf0' }} />
              <button onClick={() => flash('Feedback sent — thank you!')}
                className="px-4 py-2 rounded-xl text-xs font-medium"
                style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#7bf1a8' }}>
                Send Feedback
              </button>
            </Card>

            <Card title="System Status" desc="Check if all VaagAi services are operational">
              <div className="space-y-2">
                {[
                  { name: '3D Farm Engine', status: 'operational' },
                  { name: 'Weather Service', status: 'operational' },
                  { name: 'AI Crop Doctor', status: 'operational' },
                  { name: 'Market Data', status: 'operational' },
                ].map((svc) => (
                  <div key={svc.name} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-sm" style={{ color: '#eefdf0' }}>{svc.name}</span>
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#7bf1a8' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Operational
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Community">
              <div className="flex items-center gap-3">
                <ExternalLink size={16} style={{ color: '#7bf1a8' }} />
                <a href="#" className="text-sm font-medium" style={{ color: '#7bf1a8' }}>Join our Farmer Community on WhatsApp</a>
              </div>
            </Card>
          </SectionWrap>
        )}

        {active === 'about' && (
          <SectionWrap title="About VaagAi" desc="Learn more about the platform">
            <Card>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7bf1a8, #2e7d32)' }}>
                  <Sprout size={28} style={{ color: 'white' }} />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: '#eefdf0' }}>VaagAi Smart Farming</div>
                  <div className="text-xs" style={{ color: '#5a7a6a' }}>Version 2.0.0 · Build 2026.07.05</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#95be9f' }}>
                VaagAi is an AI-powered smart farming platform that helps farmers make data-driven decisions. 
                From 3D farm visualization to AI crop disease detection, weather forecasting, and market intelligence — 
                we're building the future of agriculture technology for India and beyond.
              </p>
            </Card>

            <Card title="What's New" desc="Latest updates and features">
              <div className="space-y-3">
                {[
                  { version: '2.0.0', date: 'Jul 2026', changes: ['SaaS-level 3D farm with day/night cycle', 'Monthly/Weekly/Daily calendar views', 'AI Crop Doctor with disease detection', 'Settings hub with 11 sections'] },
                  { version: '1.5.0', date: 'Jun 2026', changes: ['Supabase authentication', 'Guest demo mode', 'Landing page redesign'] },
                  { version: '1.0.0', date: 'May 2026', changes: ['Initial release', '3D farm visualization', 'Crop recommendations'] },
                ].map((rel) => (
                  <div key={rel.version} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold" style={{ color: '#7bf1a8' }}>v{rel.version}</span>
                      <span className="text-[11px]" style={{ color: '#5a7a6a' }}>{rel.date}</span>
                    </div>
                    <ul className="space-y-1">
                      {rel.changes.map((c) => (
                        <li key={c} className="flex items-center gap-1.5 text-[11px]" style={{ color: '#95be9f' }}>
                          <span className="w-1 h-1 rounded-full" style={{ background: '#10B981' }} /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Technology Stack">
              <div className="flex flex-wrap gap-2">
                {['React 19', 'TypeScript', 'Three.js / R3F', 'Vite', 'Tailwind CSS', 'Zustand', 'Supabase', 'Express.js', 'Redis', 'TanStack Query'].map((tech) => (
                  <span key={tech} className="px-3 py-1.5 rounded-full text-[11px] font-medium"
                    style={{ background: 'rgba(123, 207, 137, 0.08)', color: '#7bf1a8' }}>
                    {tech}
                  </span>
                ))}
              </div>
            </Card>

            <Card title="Licenses">
              <p className="text-xs leading-relaxed" style={{ color: '#5a7a6a' }}>
                VaagAi uses open-source software including React (MIT), Three.js (MIT), date-fns (MIT), 
                Zustand (MIT), Tailwind CSS (MIT), and others. Full license information is available on request.
              </p>
            </Card>
          </SectionWrap>
        )}

        {active === 'terms' && (
          <SectionWrap title="Terms & Policies" desc="Legal agreements and policies">
            <Card title="Terms of Service" desc="Last updated: July 1, 2026">
              <div className="space-y-3 text-xs leading-relaxed" style={{ color: '#95be9f' }}>
                <p><strong style={{ color: '#eefdf0' }}>1. Acceptance of Terms.</strong> By accessing and using VaagAi Smart Farming Platform ("VaagAi", "we", "us"), you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
                <p><strong style={{ color: '#eefdf0' }}>2. Use of Service.</strong> VaagAi provides AI-powered farming assistance, crop recommendations, weather data, and farm management tools. You agree to use the service lawfully and not to misuse, reverse engineer, or disrupt the platform.</p>
                <p><strong style={{ color: '#eefdf0' }}>3. Account Responsibility.</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.</p>
                <p><strong style={{ color: '#eefdf0' }}>4. Subscriptions.</strong> Paid plans (Pro at ₹399/mo, Enterprise at ₹599/mo) are billed monthly. You can cancel anytime. Refunds are issued at our discretion within 7 days of payment.</p>
                <p><strong style={{ color: '#eefdf0' }}>5. AI Disclaimer.</strong> Our AI recommendations (crop doctor, recommendations, predictions) are advisory in nature. We do not guarantee agricultural outcomes. Always consult local agricultural experts for critical decisions.</p>
                <p><strong style={{ color: '#eefdf0' }}>6. Data Ownership.</strong> You retain ownership of your farm data. We process it solely to provide and improve our services. See our Privacy Policy for details.</p>
                <p><strong style={{ color: '#eefdf0' }}>7. Limitation of Liability.</strong> VaagAi is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages arising from use of the service.</p>
                <p><strong style={{ color: '#eefdf0' }}>8. Termination.</strong> We may suspend or terminate your account for violations of these Terms. You may delete your account at any time from Settings.</p>
                <p><strong style={{ color: '#eefdf0' }}>9. Changes.</strong> We may update these Terms periodically. Continued use after changes constitutes acceptance.</p>
                <p><strong style={{ color: '#eefdf0' }}>10. Contact.</strong> For questions about these Terms, email legal@vaagai.farm.</p>
              </div>
              <button className="mt-4 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#7bf1a8' }}>
                <ExternalLink size={12} /> View Full Terms
              </button>
            </Card>

            <Card title="Privacy Policy" desc="Last updated: July 1, 2026">
              <div className="space-y-3 text-xs leading-relaxed" style={{ color: '#95be9f' }}>
                <p><strong style={{ color: '#eefdf0' }}>1. Information We Collect.</strong> We collect: (a) Account data (name, email, phone), (b) Farm data (crop plots, tasks, sensor readings), (c) Usage data (pages visited, features used), (d) Device data (browser, IP address).</p>
                <p><strong style={{ color: '#eefdf0' }}>2. How We Use Your Data.</strong> To provide farm management features, AI recommendations, weather alerts, market data, and to improve our services. We never sell your data to third parties.</p>
                <p><strong style={{ color: '#eefdf0' }}>3. Data Storage.</strong> Your data is stored securely with encryption at rest and in transit. Farm data is stored locally in your browser and optionally synced to our servers.</p>
                <p><strong style={{ color: '#eefdf0' }}>4. Data Sharing.</strong> We share data only with: (a) Service providers (Supabase, cloud hosting), (b) Legal authorities when required by law, (c) Integration partners you explicitly connect.</p>
                <p><strong style={{ color: '#eefdf0' }}>5. Your Rights.</strong> You can: Access your data, export it, delete it, correct inaccuracies, and opt-out of analytics. Use the Data & Privacy section to manage these rights.</p>
                <p><strong style={{ color: '#eefdf0' }}>6. Cookies.</strong> We use essential cookies for authentication and preference storage. See our Cookie Policy below.</p>
                <p><strong style={{ color: '#eefdf0' }}>7. Children's Privacy.</strong> VaagAi is not directed to children under 16. We do not knowingly collect data from minors.</p>
                <p><strong style={{ color: '#eefdf0' }}>8. Data Retention.</strong> We retain your data while your account is active. Deleted data is removed within 30 days. See Data & Privacy for retention controls.</p>
                <p><strong style={{ color: '#eefdf0' }}>9. Contact.</strong> For privacy questions, email privacy@vaagai.farm.</p>
              </div>
              <button className="mt-4 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#7bf1a8' }}>
                <ExternalLink size={12} /> View Full Privacy Policy
              </button>
            </Card>

            <Card title="Cookie Policy" desc="Last updated: July 1, 2026">
              <div className="space-y-2 text-xs leading-relaxed" style={{ color: '#95be9f' }}>
                <p>VaagAi uses the following types of cookies and local storage:</p>
                <div className="space-y-2 mt-2">
                  {[
                    { name: 'Authentication', purpose: 'Stores your login session token', type: 'Essential', duration: '30 days' },
                    { name: 'Preferences', purpose: 'Remembers theme, language, and farm settings', type: 'Essential', duration: 'Persistent' },
                    { name: 'Analytics', purpose: 'Anonymous usage statistics to improve the product', type: 'Optional', duration: '90 days' },
                  ].map((c) => (
                    <div key={c.name} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <Lock size={14} className="mt-0.5 shrink-0" style={{ color: c.type === 'Essential' ? '#7bf1a8' : '#5a7a6a' }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: '#eefdf0' }}>{c.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: c.type === 'Essential' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: c.type === 'Essential' ? '#7bf1a8' : '#fbbf24' }}>{c.type}</span>
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#5a7a6a' }}>{c.purpose} · Duration: {c.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="GDPR & DPDP Compliance" desc="Your rights under data protection laws">
              <div className="space-y-2">
                {['Right to Access — Request a copy of your data', 'Right to Rectification — Correct inaccurate data', 'Right to Erasure — Delete your account and data', 'Right to Portability — Export data in machine-readable format', 'Right to Object — Opt-out of certain data processing'].map((right) => (
                  <div key={right} className="flex items-center gap-2 text-xs" style={{ color: '#95be9f' }}>
                    <Check size={14} style={{ color: '#10B981' }} /> {right}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px]" style={{ color: '#5a7a6a' }}>
                VaagAi complies with the EU General Data Protection Regulation (GDPR) and India's Digital Personal Data Protection Act (DPDP 2023).
              </p>
            </Card>

            <Card title="Refund Policy">
              <p className="text-xs leading-relaxed" style={{ color: '#95be9f' }}>
                Subscription refunds are available within 7 days of payment if you have not extensively used premium features. 
                To request a refund, email billing@vaagai.farm with your account email and transaction ID. 
                Refunds are processed within 5-7 business days to the original payment method.
              </p>
            </Card>
          </SectionWrap>
        )}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  )
}

function SectionWrap({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold" style={{ color: '#eefdf0' }}>{title}</h2>
        <p className="text-sm mt-0.5" style={{ color: '#5a7a6a' }}>{desc}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex justify-end">
      <button onClick={onSave}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
        <Check size={16} /> Save Changes
      </button>
    </div>
  )
}
