import { useState, useCallback } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import VaagAiChat from './ChatWidget'

export default function AppLayout({ children, title, subtitle, status = 'connected' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((v) => !v)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--color-background)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <TopBar
          title={title}
          subtitle={subtitle}
          status={status}
          onMenuToggle={toggleSidebar}
          menuOpen={sidebarOpen}
        />
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>
      <VaagAiChat />
    </div>
  )
}