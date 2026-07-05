import bcrypt from 'bcryptjs'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import jwt from 'jsonwebtoken'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../../services/database'
import config from '../../config'
import redisService from '../../services/cache'

export interface AuthPayload {
  userId: string
  email: string
  role: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface StoredUser {
  id: string
  email: string
  passwordHash: string
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  role: string
  isActive: boolean
  createdAt: Date
  lastLoginAt?: Date | null
  farmName?: string | null
  farmLocation?: string | null
  farmArea?: number | null
}

interface StoredSession {
  userId: string
  token: string
  refreshToken: string
  expiresAt: Date
}

const fallbackUsersByEmail = new Map<string, StoredUser>()
const fallbackUsersById = new Map<string, StoredUser>()
const fallbackSessionsByToken = new Map<string, StoredSession>()
const fallbackStorePath = path.resolve(process.cwd(), '.vaagai-auth-fallback.json')

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const isDatabaseUnavailableError = (error: unknown): boolean => {
  const err = error as NodeJS.ErrnoException & { code?: string }
  const message = typeof err?.message === 'string' ? err.message : ''

  return Boolean(
    err?.code === 'ECONNREFUSED' ||
    err?.code === 'P1001' ||
    err?.code === 'P1002' ||
    message.includes('ECONNREFUSED') ||
    message.includes('database server') ||
    message.includes('Unable to connect')
  )
}

const publicUser = (user: StoredUser) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  farmName: user.farmName,
  farmLocation: user.farmLocation,
  farmArea: user.farmArea,
})

const storeFallbackUser = (user: StoredUser): StoredUser => {
  const normalizedUser = { ...user, email: normalizeEmail(user.email) }
  fallbackUsersByEmail.set(normalizedUser.email, normalizedUser)
  fallbackUsersById.set(normalizedUser.id, normalizedUser)
  persistFallbackStore()
  return normalizedUser
}

const getFallbackUserByEmail = (email: string): StoredUser | null => {
  return fallbackUsersByEmail.get(normalizeEmail(email)) ?? null
}

const getFallbackUserById = (userId: string): StoredUser | null => {
  return fallbackUsersById.get(userId) ?? null
}

const loadFallbackStore = (): void => {
  if (!existsSync(fallbackStorePath)) return

  try {
    const raw = readFileSync(fallbackStorePath, 'utf8')
    if (!raw.trim()) return

    const parsed = JSON.parse(raw) as { users?: StoredUser[] }
    for (const user of parsed.users ?? []) {
      storeFallbackUser({
        ...user,
        createdAt: new Date(user.createdAt),
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
      })
    }
  } catch (error) {
    console.warn('Could not load fallback auth store, starting empty')
    console.warn(error)
  }
}

const persistFallbackStore = (): void => {
  try {
    const users = [...fallbackUsersByEmail.values()]
    writeFileSync(fallbackStorePath, JSON.stringify({ users }, null, 2), 'utf8')
  } catch (error) {
    console.warn('Could not persist fallback auth store')
    console.warn(error)
  }
}

loadFallbackStore()

class AuthService {
  private recordFallbackSession(userId: string, accessToken: string, refreshToken: string): void {
    fallbackSessionsByToken.set(accessToken, {
      userId,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // Generate JWT tokens
  generateTokens(user: { id: string; email: string; role: string }): TokenPair {
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: '7d' as const,
    })

    const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, config.jwt.secret, {
      expiresIn: '30d' as const,
    })

    return { accessToken, refreshToken }
  }

  // Verify JWT token
  verifyToken(token: string): AuthPayload {
    return jwt.verify(token, config.jwt.secret) as AuthPayload
  }

  // Create user session
  async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const sessionId = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    try {
      // Store in database
      await prisma.userSession.create({
        data: {
          id: sessionId,
          userId,
          token: uuidv4(),
          refreshToken: await this.hashPassword(refreshToken),
          expiresAt,
          ipAddress,
          userAgent,
        },
      })
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }
    }

    // Cache session in Redis
    await redisService.cacheSession(sessionId, { userId, createdAt: new Date() })

    return sessionId
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as { userId: string; type: string }

      if (decoded.type !== 'refresh') return null

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, isActive: true },
      })

      if (!user || !user.isActive) return null

      return this.generateTokens(user)
    } catch {
      return null
    }
  }

  // Revoke session
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { isRevoked: true },
      })
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }
    }

    await redisService.deleteSession(sessionId)
  }

  async revokeSessionByToken(token: string): Promise<void> {
    try {
      await prisma.userSession.deleteMany({ where: { token } })
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }
    }

    fallbackSessionsByToken.delete(token)
  }

  // Register user
  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    farmName?: string,
    farmLocation?: string,
    farmArea?: number
  ): Promise<{ user: any; tokens: TokenPair }> {
    const normalizedEmail = normalizeEmail(email)

    let existing = null
    try {
      existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }
    }

    if (existing || getFallbackUserByEmail(normalizedEmail)) {
      throw new Error('User already exists')
    }

    const passwordHash = await this.hashPassword(password)

    let user = storeFallbackUser({
      id: uuidv4(),
      email: normalizedEmail,
      passwordHash,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      role: 'OWNER',
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      farmName: farmName ?? null,
      farmLocation: farmLocation ?? null,
      farmArea: farmArea ?? null,
    })

    try {
      const createdUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName,
          lastName,
          role: 'OWNER',
          isActive: true,
          emailVerified: true,
          farmName: farmName ?? null,
          farmLocation: farmLocation ?? null,
          farmArea: farmArea ?? null,
        },
      })

      user = storeFallbackUser({
        id: createdUser.id,
        email: createdUser.email,
        passwordHash,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        avatarUrl: createdUser.avatarUrl,
        role: createdUser.role,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
        lastLoginAt: createdUser.lastLoginAt,
        farmName: createdUser.farmName,
        farmLocation: createdUser.farmLocation,
        farmArea: createdUser.farmArea,
      })
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }
    }

    const tokens = this.generateTokens(user)
    this.recordFallbackSession(user.id, tokens.accessToken, tokens.refreshToken)

    // Create initial session
    await this.createSession(user.id, tokens.refreshToken)

    return { user: publicUser(user), tokens }
  }

  // Login
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: any; tokens: TokenPair }> {
    const normalizedEmail = normalizeEmail(email)

    let user: StoredUser | null = null
    try {
      const dbUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (dbUser) {
        user = storeFallbackUser({
          id: dbUser.id,
          email: dbUser.email,
          passwordHash: dbUser.passwordHash,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          avatarUrl: dbUser.avatarUrl,
          role: dbUser.role,
          isActive: dbUser.isActive,
          createdAt: dbUser.createdAt,
          lastLoginAt: dbUser.lastLoginAt,
          farmName: dbUser.farmName,
          farmLocation: dbUser.farmLocation,
          farmArea: dbUser.farmArea,
        })
      }
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }
      user = getFallbackUserByEmail(normalizedEmail)
    }

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValid = await this.verifyPassword(password, user.passwordHash)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    if (!user.isActive) {
      throw new Error('Account is disabled')
    }

    // Update last login
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }
    }

    user = storeFallbackUser({ ...user, lastLoginAt: new Date() })

    const tokens = this.generateTokens(user)
    this.recordFallbackSession(user.id, tokens.accessToken, tokens.refreshToken)

    // Create session
    await this.createSession(user.id, tokens.refreshToken, ipAddress, userAgent)

    return { user: publicUser(user), tokens }
  }

  // Get user from token
  async getUserFromToken(token: string): Promise<any> {
    const payload = this.verifyToken(token)

    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          farmName: true,
          farmLocation: true,
          farmArea: true,
        },
      })

      if (user) {
        storeFallbackUser({
          id: user.id,
          email: user.email,
          passwordHash: '',
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isActive: true,
          createdAt: user.createdAt,
        })
      }

      return user
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }

      const user = getFallbackUserById(payload.userId)
      return user ? publicUser(user) : null
    }
  }
}

export const authService = new AuthService()
export default authService