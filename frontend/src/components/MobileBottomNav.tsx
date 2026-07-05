import { useLanguage } from '../contexts/LanguageContext'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Tractor, Sprout, TrendingUp, Bot, Calendar, Bug, ScrollText,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/farm', label: 'Farm', icon: Tractor },
  { to: '/recommendations', label: 'Crops', icon: Sprout },
  { to: '/market', label: 'Market', icon: TrendingUp },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/copilot', label: 'Copilot', icon: Bot },
  { to: '/crop-doctor', label: 'Doctor', icon: Bug },
  { to: '/disease-history', label: 'History', icon: ScrollText },
]

export default function MobileBottomNav() {
  const { t } = useLanguage()
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-area-bottom"
      style={{
        background: 'linear-gradient(180deg, rgba(12, 20, 14, 0.97) 0%, rgba(8, 14, 10, 0.99) 100%)',
        borderTop: '1px solid rgba(123, 207, 137, 0.14)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-150 relative"
              style={{
                minWidth: 52,
              }}
            >
              {isActive && (
                <span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #7bf1a8, #43a047)',
                    boxShadow: '0 0 12px rgba(123,241,168,0.6)',
                  }}
                />
              )}
              <span
                className="flex items-center justify-center rounded-xl transition-all duration-150"
                style={{
                  width: 36, height: 36,
                  background: isActive ? 'rgba(123,241,168,0.12)' : 'transparent',
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  style={{
                    color: isActive ? '#8ff0ab' : '#7a9a82',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(123,241,168,0.3))' : 'none',
                  }}
                />
              </span>
              <span
                className="text-[10px] font-semibold leading-none"
                style={{
                  color: isActive ? '#8ff0ab' : '#7a9a82',
                }}
              >
                {t(`nav.${to.slice(1)}`, label)}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
