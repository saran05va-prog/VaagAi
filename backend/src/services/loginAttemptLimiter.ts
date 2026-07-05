import redisService from './cache'

// Check if Redis is available via the public health check
function redisAvailable(): boolean {
  return redisService['client'] !== null
}

interface AttemptEntry {
  count: number
  firstAttemptAt: number
  lockedUntil: number | null
}

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const WINDOW_MS = 15 * 60 * 1000 // sliding window for counting attempts

// In-memory fallback when Redis is unavailable
const memoryStore = new Map<string, AttemptEntry>()

const getKey = (email: string): string => `login_attempts:${email.toLowerCase().trim()}`
const getLockKey = (email: string): string => `login_locked:${email.toLowerCase().trim()}`

const cleanupExpired = (): void => {
  const now = Date.now()
  for (const [key, entry] of memoryStore) {
    if (now - entry.firstAttemptAt > WINDOW_MS && (!entry.lockedUntil || now > entry.lockedUntil)) {
      memoryStore.delete(key)
    }
  }
}

export async function recordFailedAttempt(email: string): Promise<{ attempts: number; locked: boolean; remainingLockoutMs: number }> {
  const key = getKey(email)
  const now = Date.now()

  if (redisAvailable()) {
    try {
      const attempts = await redisService.get(key)
      const nextCount = attempts ? parseInt(attempts) + 1 : 1
      await redisService.set(key, String(nextCount), Math.ceil(WINDOW_MS / 1000))

      if (nextCount >= MAX_ATTEMPTS) {
        await redisService.set(getLockKey(email), '1', Math.ceil(LOCKOUT_DURATION_MS / 1000))
        return { attempts: nextCount, locked: true, remainingLockoutMs: LOCKOUT_DURATION_MS }
      }

      return { attempts: nextCount, locked: false, remainingLockoutMs: 0 }
    } catch {
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  cleanupExpired()
  const existing = memoryStore.get(key)

  if (existing?.lockedUntil) {
    if (now < existing.lockedUntil) {
      return { attempts: existing.count, locked: true, remainingLockoutMs: existing.lockedUntil - now }
    }
    memoryStore.delete(key)
  }

  if (!existing || now - existing.firstAttemptAt > WINDOW_MS) {
    memoryStore.set(key, { count: 1, firstAttemptAt: now, lockedUntil: null })
    return { attempts: 1, locked: false, remainingLockoutMs: 0 }
  }

  const updated: AttemptEntry = {
    ...existing,
    count: existing.count + 1,
    lockedUntil: existing.count + 1 >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION_MS : null,
  }
  memoryStore.set(key, updated)

  return {
    attempts: updated.count,
    locked: updated.count >= MAX_ATTEMPTS,
    remainingLockoutMs: updated.lockedUntil ? updated.lockedUntil - now : 0,
  }
}

export async function resetAttempts(email: string): Promise<void> {
  if (redisAvailable()) {
    try {
      await redisService.del(getKey(email))
      await redisService.del(getLockKey(email))
      return
    } catch {
      // Fall through
    }
  }

  memoryStore.delete(getKey(email))
  memoryStore.delete(getLockKey(email))
  cleanupExpired()
}

export async function isLocked(email: string): Promise<{ locked: boolean; remainingLockoutMs: number }> {
  const now = Date.now()

  if (redisAvailable()) {
    try {
      const lockVal = await redisService.get(getLockKey(email))
      if (lockVal !== null) {
        // Estimate remaining time — we don't have TTL via the public API,
        // so assume full lockout duration
        return { locked: true, remainingLockoutMs: LOCKOUT_DURATION_MS }
      }
      return { locked: false, remainingLockoutMs: 0 }
    } catch {
      // Fall through
    }
  }

  cleanupExpired()
  const entry = memoryStore.get(getKey(email))
  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return { locked: true, remainingLockoutMs: entry.lockedUntil - now }
  }
  return { locked: false, remainingLockoutMs: 0 }
}

export const LOGIN_ATTEMPT_CONFIG = {
  MAX_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  WINDOW_MS,
}
