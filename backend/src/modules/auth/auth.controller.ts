import { Router, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '../../services/database'
import { authenticate, generateToken, AuthRequest } from './auth.middleware'
import authService from './auth.service'
import config from '../../config'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Register
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body)

    const { user, tokens } = await authService.register(
      data.email,
      data.password,
      data.firstName,
      data.lastName
    )

    res.status(201).json({
      user,
      token: tokens.accessToken,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return
    }
    if (error instanceof Error && error.message === 'User already exists') {
      res.status(409).json({ error: error.message })
      return
    }
    console.error('Register error:', error)
    res.status(500).json({ error: 'Failed to register' })
  }
})

// Login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body)

    const { user, tokens } = await authService.login(
      data.email,
      data.password,
      req.ip || undefined,
      req.headers['user-agent'] || undefined
    )

    res.json({
      user,
      token: tokens.accessToken,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
      return
    }
    if (error instanceof Error && error.message === 'Invalid credentials') {
      res.status(401).json({ error: error.message })
      return
    }
    console.error('Login error:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
})

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    const user = await authService.getUserFromToken(token)

    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone } = req.body

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { firstName, lastName, phone },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true },
    })

    res.json({ user })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Change password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      res.status(400).json({ error: 'Current password is incorrect' })
      return
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash },
    })

    // Invalidate all sessions
    await prisma.userSession.deleteMany({ where: { userId: req.user!.userId } })

    res.json({ success: true, message: 'Password changed. Please login again.' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

// Logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      await authService.revokeSessionByToken(token)
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Failed to logout' })
  }
})

// Google OAuth sync - for Supabase-initiated OAuth
router.post('/google/sync', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user } = req.body

    if (!user || !user.email) {
      res.status(400).json({ error: 'User data required' })
      return
    }

    const nameParts = (user.user_metadata?.full_name || user.email).split(' ')

    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: nameParts[0] || 'Google',
        lastName: nameParts.slice(1).join(' ') || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        lastLoginAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
        firstName: nameParts[0] || 'Google',
        lastName: nameParts.slice(1).join(' ') || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        role: 'OWNER',
        isActive: true,
      },
    })

    const token = generateToken(dbUser.id, dbUser.email)

    try {
      await prisma.userSession.create({
        data: {
          userId: dbUser.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        },
      })
    } catch (sessionError) {
      console.warn('Google session could not be stored, continuing with token only')
      console.warn(sessionError)
    }

    res.json({
      user: dbUser,
      token,
    })
  } catch (error) {
    console.error('Google sync error:', error)
    res.status(500).json({ error: 'Failed to sync user' })
  }
})

// Google OAuth - Redirect to Google
router.get('/google', (req, res) => {
  const { clientId, redirectUri } = config.google

  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'Google OAuth not configured' })
    return
  }

  const scope = 'openid profile email'
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=select_account`
  res.redirect(authUrl)
})

// Google OAuth Callback - GET (redirect from Google)
router.get('/google/callback', async (req, res: Response): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  try {
    const { code, error: googleError } = req.query

    if (googleError) {
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`)
      return
    }

    if (!code || typeof code !== 'string') {
      res.redirect(`${frontendUrl}/login?error=no_code`)
      return
    }

    const { clientId, clientSecret, redirectUri } = config.google

    if (!clientId || !clientSecret || !redirectUri) {
      res.redirect(`${frontendUrl}/login?error=oauth_not_configured`)
      return
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string }

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData)
      res.redirect(`${frontendUrl}/login?error=token_exchange_failed`)
      return
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const googleUser = (await userResponse.json()) as { email?: string; name?: string; picture?: string }

    if (!userResponse.ok || !googleUser.email) {
      console.error('Google userinfo failed:', googleUser)
      res.redirect(`${frontendUrl}/login?error=user_info_failed`)
      return
    }

    const fallbackUser = {
      id: googleUser.email,
      email: googleUser.email,
      firstName: googleUser.name?.split(' ')[0] || 'Google',
      lastName: googleUser.name?.split(' ').slice(1).join(' ') || null,
      role: 'FARMER',
    }

    // Find or create user when the database is available.
    // In local development, fall back to the Google profile so the login flow can still complete.
    let authUser = fallbackUser

    try {
      let user = await prisma.user.findUnique({ where: { email: googleUser.email } })

      if (!user) {
        const nameParts = googleUser.name?.split(' ') || ['Google']
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
            firstName: nameParts[0] || 'Google',
            lastName: nameParts.slice(1).join(' ') || null,
            avatarUrl: googleUser.picture || null,
            isActive: true,
          },
        })
      } else if (!user.isActive) {
        res.redirect(`${frontendUrl}/login?error=account_disabled`)
        return
      }

      authUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || 'Google',
        lastName: user.lastName,
        role: user.role,
      }
    } catch (dbError) {
      console.warn('Google user could not be stored locally, using Google profile fallback only')
      console.warn(dbError)
    }

    // Generate our JWT
    const token = generateToken(authUser.id, authUser.email)

    // Create session
    try {
      await prisma.userSession.create({
        data: {
          userId: authUser.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        },
      })
    } catch (sessionError) {
      console.warn('Google session could not be stored, continuing with local redirect only')
      console.warn(sessionError)
    }

    // Redirect to frontend with token
    const userParam = encodeURIComponent(JSON.stringify({
      id: authUser.id,
      email: authUser.email,
      firstName: authUser.firstName,
      lastName: authUser.lastName,
      role: authUser.role,
    }))

    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userParam}`)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    res.redirect(`${frontendUrl}/login?error=auth_failed`)
  }
})

// Google OAuth Callback - POST (for frontend API call)
router.post('/google/callback', async (req, res: Response): Promise<void> => {
  try {
    const { code } = req.body

    if (!code) {
      res.status(400).json({ error: 'Authorization code required' })
      return
    }

    const { clientId, clientSecret, redirectUri } = config.google

    if (!clientId || !clientSecret || !redirectUri) {
      res.status(500).json({ error: 'Google OAuth not configured' })
      return
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string }

    if (!tokenResponse.ok) {
      console.error('Google token exchange failed:', tokenData)
      res.status(400).json({ error: 'Failed to exchange authorization code' })
      return
    }

    if (!tokenData.access_token) {
      res.status(400).json({ error: 'No access token received' })
      return
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const googleUser = (await userResponse.json()) as { email?: string; name?: string; picture?: string }

    if (!userResponse.ok) {
      console.error('Google userinfo failed:', googleUser)
      res.status(400).json({ error: 'Failed to get user info from Google' })
      return
    }

    // Find or create user
    if (!googleUser.email) {
      res.status(400).json({ error: 'Google email not available' })
      return
    }

    let user = await prisma.user.findUnique({ where: { email: googleUser.email } })

    if (!user) {
      // Create new user
      const nameParts = googleUser.name?.split(' ') || ['Google']
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
          firstName: nameParts[0] || 'Google',
          lastName: nameParts.slice(1).join(' ') || null,
          avatarUrl: googleUser.picture || null,
          isActive: true,
        },
      })
    } else if (!user.isActive) {
      res.status(401).json({ error: 'Account is disabled' })
      return
    }

    // Generate our JWT
    const token = generateToken(user.id, user.email)

    // Create session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      },
    })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

export default router