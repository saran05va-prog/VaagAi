import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type AuthTab = 'login' | 'signup'

interface AuthModalContextType {
  isOpen: boolean
  initialTab: AuthTab
  openAuthModal: (tab?: AuthTab, message?: string) => void
  closeAuthModal: () => void
  message: string | null
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<AuthTab>('login')
  const [message, setMessage] = useState<string | null>(null)

  const openAuthModal = useCallback((tab: AuthTab = 'login', msg?: string) => {
    setInitialTab(tab)
    setMessage(msg ?? null)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
    setMessage(null)
  }, [])

  return (
    <AuthModalContext.Provider value={{ isOpen, initialTab, openAuthModal, closeAuthModal, message }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal(): AuthModalContextType {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within an AuthModalProvider')
  return ctx
}
