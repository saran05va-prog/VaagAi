import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'en' | 'hi' | 'ta' | 'te' | 'mr' | 'bn'
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
export type UnitSystem = 'metric' | 'imperial'
export type PlanTier = 'free' | 'pro' | 'enterprise'

export interface NotificationPrefs {
  emailAlerts: boolean
  pushNotifications: boolean
  smsAlerts: boolean
  weatherAlerts: boolean
  pestAlerts: boolean
  harvestReminders: boolean
  taskReminders: boolean
  marketUpdates: boolean
  weeklyReport: boolean
  productUpdates: boolean
}

export interface SecurityPrefs {
  twoFactorEnabled: boolean
  sessionTimeout: number
  loginAlerts: boolean
}

export interface SettingsState {
  theme: ThemeMode
  language: Language
  timezone: string
  dateFormat: DateFormat
  unitSystem: UnitSystem
  plan: PlanTier

  profile: {
    firstName: string
    lastName: string
    email: string
    phone: string
    bio: string
    location: string
    farmName: string
    totalArea: number
    avatarUrl: string
  }

  notifications: NotificationPrefs
  security: SecurityPrefs

  apiKeys: { id: string; name: string; key: string; created: string; lastUsed: string }[]
  integrations: { id: string; name: string; connected: boolean; type: string }[]

  setTheme: (theme: ThemeMode) => void
  setLanguage: (lang: Language) => void
  setTimezone: (tz: string) => void
  setDateFormat: (fmt: DateFormat) => void
  setUnitSystem: (units: UnitSystem) => void
  setPlan: (plan: PlanTier) => void
  setProfile: (data: Partial<SettingsState['profile']>) => void
  setNotifications: (data: Partial<NotificationPrefs>) => void
  setSecurity: (data: Partial<SecurityPrefs>) => void
  addApiKey: (name: string) => void
  removeApiKey: (id: string) => void
  toggleIntegration: (id: string) => void
}

const genKey = () => 'vai_' + Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'en',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      unitSystem: 'metric',
      plan: 'free',

      profile: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: '',
        location: 'Coimbatore, Tamil Nadu, India',
        farmName: 'Vaagai Smart Farm',
        totalArea: 5.5,
        avatarUrl: '',
      },

      notifications: {
        emailAlerts: true,
        pushNotifications: true,
        smsAlerts: false,
        weatherAlerts: true,
        pestAlerts: true,
        harvestReminders: true,
        taskReminders: true,
        marketUpdates: false,
        weeklyReport: true,
        productUpdates: true,
      },

      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30,
        loginAlerts: true,
      },

      apiKeys: [],
      integrations: [
        { id: 'int1', name: 'OpenWeather API', connected: false, type: 'weather' },
        { id: 'int2', name: 'WhatsApp Business', connected: false, type: 'messaging' },
        { id: 'int3', name: 'Google Sheets', connected: false, type: 'export' },
        { id: 'int4', name: 'AgriMarket Data', connected: false, type: 'market' },
      ],

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setTimezone: (timezone) => set({ timezone }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setPlan: (plan) => set({ plan }),
      setProfile: (data) => set((s) => ({ profile: { ...s.profile, ...data } })),
      setNotifications: (data) => set((s) => ({ notifications: { ...s.notifications, ...data } })),
      setSecurity: (data) => set((s) => ({ security: { ...s.security, ...data } })),
      addApiKey: (name) => set((s) => ({
        apiKeys: [...s.apiKeys, {
          id: 'key_' + Date.now(),
          name,
          key: genKey(),
          created: new Date().toISOString().slice(0, 10),
          lastUsed: 'Never',
        }],
      })),
      removeApiKey: (id) => set((s) => ({ apiKeys: s.apiKeys.filter((k) => k.id !== id) })),
      toggleIntegration: (id) => set((s) => ({
        integrations: s.integrations.map((i) => i.id === id ? { ...i, connected: !i.connected } : i),
      })),
    }),
    { name: 'vaagai-settings' },
  ),
)
