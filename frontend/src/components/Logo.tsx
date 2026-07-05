interface LogoProps {
  size?: number
  withText?: boolean
  textColor?: string
  className?: string
}

export function Logo({ size = 40, withText = true, textColor = '#effdf1', className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="flex items-center justify-center rounded-2xl shrink-0"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #7bf1a8 0%, #2e7d32 52%, #11361a 100%)',
          boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)',
        }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 64 64" fill="none">
          <path d="M32 50 L32 30" stroke="white" strokeWidth={3.5} strokeLinecap="round" />
          <path d="M32 34 C24 34 18 28 18 20 C26 20 32 26 32 34 Z" fill="white" />
          <path d="M32 30 C40 30 46 24 46 16 C38 16 32 22 32 30 Z" fill="white" />
          <circle cx="32" cy="14" r="3" fill="#aaffcc" />
          <circle cx="32" cy="14" r="1.5" fill="white" />
          <circle cx="46" cy="10" r="1.8" fill="#aaffcc" opacity="0.7" />
          <circle cx="18" cy="12" r="1.5" fill="#aaffcc" opacity="0.6" />
        </svg>
      </div>
      {withText && (
        <span
          className="font-bold tracking-tight"
          style={{ fontFamily: 'Sora, sans-serif', fontSize: size * 0.42, color: textColor, lineHeight: 1 }}
        >
          Vaag<span style={{ color: '#7bf1a8' }}>Ai</span>
        </span>
      )}
    </div>
  )
}

export default Logo
