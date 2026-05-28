import { config } from 'dotenv'

config()

// Parse Railway REDIS_URL if provided
const parseRedisUrl = (url: string | undefined) => {
  if (!url) return { host: '', port: 6379, password: '' }
  try {
    const match = url.match(/redis(?:s)?:\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)/)
    if (match) {
      return {
        host: match[3] || '',
        port: parseInt(match[4] || '6379'),
        password: match[2] || '',
      }
    }
  } catch {}
  return { host: '', port: 6379, password: '' }
}

const redisFromUrl = parseRedisUrl(process.env.REDIS_URL)

export default {
  server: {
    port: parseInt(process.env.PORT || process.env.RAILWAY_SERVICE_PORT || '3002'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/agritech',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  redis: {
    // Normalize localhost to IPv4 loopback to avoid IPv6 (::1) resolution issues
    host: (process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : process.env.REDIS_HOST) || redisFromUrl.host || '',
    port: parseInt(process.env.REDIS_PORT || String(redisFromUrl.port || 6379)),
    password: process.env.REDIS_PASSWORD || redisFromUrl.password || '',
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    allowedMimeTypes: [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  weatherApi: {
    key: process.env.WEATHER_API_KEY || '',
  },
  agmarknet: {
    apiKey: process.env.AGMARKNET_API_KEY || '',
    resourceId: process.env.RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070',
  },
  groqApi: {
    key: process.env.GROQ_API_KEY || '',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || (process.env.NODE_ENV === 'production'
      ? `https://smartfarmai-production.up.railway.app/api/auth/google/callback`
      : `http://localhost:3002/api/auth/google/callback`),
    redirectUriAlt: process.env.NODE_ENV === 'production'
      ? `https://vaagaiai.netlify.app/auth/callback`
      : `http://localhost:5174/api/auth/google/callback`,
  },
  frontendUrl: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production'
    ? 'https://vaagaiai.netlify.app'
    : 'http://localhost:5174'),
}