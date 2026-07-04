import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import FarmScene from './Farm3DScene'
import Farm3DUIControls from './Farm3DUIControls'
import Sidebar from '../Sidebar'
import { Menu, X, Bell, Zap } from 'lucide-react'

export default function FarmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {!isMobile && <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />}

      <div className="relative flex-1 min-w-0">
        <div className="absolute inset-0">
          <FarmScene />
        </div>

        <Farm3DUIControls />

        {/* Mobile top bar */}
        <div className="lg:hidden absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-gray-900/80 backdrop-blur-sm rounded-lg text-white pointer-events-auto"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button className="p-2 bg-gray-900/80 backdrop-blur-sm rounded-lg text-gray-400 relative">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>
      </div>

      {isMobile && sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 h-full z-40">
            <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  )
}