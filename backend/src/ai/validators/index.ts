import type { ValidationReport, AgentInput } from '../types'
import { aiConfig } from '../config'

export async function validate(
  content: string,
  context: Pick<AgentInput, 'query' | 'sessionId' | 'userId' | 'context'>
): Promise<ValidationReport> {
  const issues: string[] = []

  if (!content || content.trim().length === 0) {
    return { isValid: false, issues: ['Empty response generated'], score: 0 }
  }

  if (content.length > aiConfig.security.maxResponseLength) {
    issues.push(`Response exceeds maximum length of ${aiConfig.security.maxResponseLength} characters`)
  }

  const blockedPhrases = [
    'I can provide instructions on how to harm',
    'how to make a bomb',
    'how to synthesize illegal drugs',
  ]

  for (const phrase of blockedPhrases) {
    if (content.toLowerCase().includes(phrase.toLowerCase())) {
      issues.push('Response contains potentially harmful content')
      break
    }
  }

  if (content.includes('{') && content.includes('}')) {
    const jsonBlocks = content.match(/\{[\s\S]*?\}/g)
    if (jsonBlocks) {
      for (const block of jsonBlocks) {
        try {
          JSON.parse(block)
        } catch {
          issues.push('Response contains malformed JSON')
        }
      }
    }
  }

  const harmfulPatterns = [
    /\b(kill|murder|suicide)\s+(yourself|someone|crop|plant)\b/i,
    /\b(hack|crack|exploit)\s+(the\s+)?(system|server|database)\b/i,
  ]

  for (const pattern of harmfulPatterns) {
    if (pattern.test(content)) {
      issues.push('Response matches harmful content patterns')
      break
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    score: issues.length === 0 ? 1 : Math.max(0, 1 - issues.length * 0.2),
    ...(issues.length > 0 && content.length > 0
      ? { timestamp: new Date().toISOString(), content: content.substring(0, 200) }
      : {}),
  }
}

export async function moderateContent(content: string): Promise<{ flagged: boolean; categories: string[] }> {
  const categories: string[] = []
  const dangerousPatterns = [
    { pattern: /\b(cyanide|arsenic|pesticide\s+abuse|illegal\s+chemical)\b/i, category: 'dangerous_chemicals' },
    { pattern: /\b(bomb|explosive|weapon)\b/i, category: 'weapons' },
    { pattern: /\b(suicide|self-harm|self.harm)\b/i, category: 'self_harm' },
  ]

  for (const { pattern, category } of dangerousPatterns) {
    if (pattern.test(content)) {
      categories.push(category)
    }
  }

  return { flagged: categories.length > 0, categories }
}
