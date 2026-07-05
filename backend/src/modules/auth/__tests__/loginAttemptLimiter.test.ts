import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  recordFailedAttempt,
  resetAttempts,
  isLocked,
  LOGIN_ATTEMPT_CONFIG,
} from '../../../services/loginAttemptLimiter'

const TEST_EMAIL = 'test@example.com'
const ANOTHER_EMAIL = 'other@example.com'

describe('loginAttemptLimiter', () => {
  beforeEach(async () => {
    // Reset state between tests
    await resetAttempts(TEST_EMAIL)
    await resetAttempts(ANOTHER_EMAIL)
  })

  it('allows login with no prior failed attempts', async () => {
    const locked = await isLocked(TEST_EMAIL)
    expect(locked.locked).toBe(false)
  })

  it('tracks failed attempts and returns count', async () => {
    const result1 = await recordFailedAttempt(TEST_EMAIL)
    expect(result1.attempts).toBe(1)
    expect(result1.locked).toBe(false)

    const result2 = await recordFailedAttempt(TEST_EMAIL)
    expect(result2.attempts).toBe(2)
    expect(result2.locked).toBe(false)
  })

  it('locks after MAX_ATTEMPTS failed attempts', async () => {
    const max = LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS

    for (let i = 1; i < max; i++) {
      const r = await recordFailedAttempt(TEST_EMAIL)
      expect(r.locked).toBe(false)
    }

    // The attempt that reaches MAX should lock
    const final = await recordFailedAttempt(TEST_EMAIL)
    expect(final.attempts).toBe(max)
    expect(final.locked).toBe(true)
    expect(final.remainingLockoutMs).toBeGreaterThan(0)
  })

  it('prevents login when locked', async () => {
    const max = LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS
    for (let i = 0; i < max; i++) {
      await recordFailedAttempt(TEST_EMAIL)
    }

    const check = await isLocked(TEST_EMAIL)
    expect(check.locked).toBe(true)
    expect(check.remainingLockoutMs).toBeGreaterThan(0)
  })

  it('resets attempts on successful login', async () => {
    for (let i = 0; i < 3; i++) {
      await recordFailedAttempt(TEST_EMAIL)
    }

    let check = await isLocked(TEST_EMAIL)
    expect(check.locked).toBe(false)

    await resetAttempts(TEST_EMAIL)

    // After reset, a fresh attempt should be count 1
    const result = await recordFailedAttempt(TEST_EMAIL)
    expect(result.attempts).toBe(1)
    expect(result.locked).toBe(false)
  })

  it('tracks different emails independently', async () => {
    await recordFailedAttempt(TEST_EMAIL)
    await recordFailedAttempt(TEST_EMAIL)
    await recordFailedAttempt(TEST_EMAIL)

    // Other email should not be affected
    const otherResult = await recordFailedAttempt(ANOTHER_EMAIL)
    expect(otherResult.attempts).toBe(1)

    // Original email should still be at 3
    const originalResult = await recordFailedAttempt(TEST_EMAIL)
    expect(originalResult.attempts).toBe(4)
  })

  it('returns remaining lockout minutes on locked response', async () => {
    const max = LOGIN_ATTEMPT_CONFIG.MAX_ATTEMPTS
    for (let i = 0; i < max; i++) {
      await recordFailedAttempt(TEST_EMAIL)
    }

    const final = await recordFailedAttempt(TEST_EMAIL)
    expect(final.remainingLockoutMs).toBeGreaterThan(0)
    expect(final.remainingLockoutMs).toBeLessThanOrEqual(LOGIN_ATTEMPT_CONFIG.LOCKOUT_DURATION_MS)
  })
})
