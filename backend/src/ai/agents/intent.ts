import type { Intent, IntentResult } from '../types'

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  GENERAL_AGRI: ['farming', 'agriculture', 'cultivation', 'grow crops', 'farm', 'farming tips'],
  CROP_SELECTION: ['which crop', 'what to plant', 'best crop', 'recommend crop', 'crop suggestion', 'suitable crop', 'what grows', 'planting season'],
  FERTILIZER: ['fertilizer', 'npk', 'manure', 'compost', 'nutrient', 'urea', 'dap', 'potash', 'organic fertil'],
  DISEASE: ['disease', 'yellowing', 'wilting', 'blight', 'rot', 'spots', 'mildew', 'infection', 'sick', 'leaves turning'],
  PEST: ['pest', 'insect', 'aphid', 'worm', 'caterpillar', 'mite', 'bug', 'infest', 'pesticide', 'spray'],
  SOIL: ['soil', 'ph', 'fertility', 'sandy soil', 'clay soil', 'loamy', 'soil test', 'soil health', 'organic matter'],
  WEATHER: ['weather', 'rain', 'temperature', 'forecast', 'climate', 'monsoon', 'season', 'humidity', 'sunny'],
  IRRIGATION: ['irrigation', 'water', 'drip', 'sprinkler', 'watering', 'flood irrig', 'moisture', 'dry spell'],
  MARKET_PRICE: ['price', 'rate', 'market', 'mandi', 'cost', 'sell', 'rate today', 'market rate', 'kg price'],
  GOVERNMENT_SCHEME: ['scheme', 'subsidy', 'government', 'pm kisan', 'kisan card', 'yojana', 'pmfby', 'fasal bima'],
  ECONOMICS: ['profit', 'cost', 'economics', 'expense', 'income', 'revenue', 'investment', 'roi', 'calculation'],
  FARM_ANALYSIS: ['analyze', 'farm analysis', 'performance', 'summary', 'overview', 'report', 'dashboard'],
  FIELD_DATA: ['my plot', 'my field', 'my farm', 'show plot', 'plot status', 'crop status', 'what is planted'],
  ACTION: ['create', 'delete', 'add plot', 'remove', 'rename', 'update', 'change', 'modify'],
  WEBSITE_NAVIGATION: ['open', 'go to', 'navigate', 'show me', 'take me', 'redirect', 'open page'],
  SMALL_TALK: ['hello', 'hi', 'hey', 'thanks', 'thank you', 'who are you', 'what can you do', 'help'],
  UNKNOWN: [],
}

const INTENT_CROPS = ['rice', 'wheat', 'corn', 'maize', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'groundnut', 'chili', 'brinjal', 'okra', 'coconut', 'mango', 'banana', 'grape', 'paddy']

function extractEntities(text: string): Record<string, string> {
  const entities: Record<string, string> = {}
  const lower = text.toLowerCase()

  for (const crop of INTENT_CROPS) {
    if (lower.includes(crop)) {
      entities.crop = crop
      break
    }
  }

  const stateMatch = lower.match(/\b(tamil nadu|kerala|karnataka|andhra|telangana|maharashtra|gujarat|rajasthan|punjab|haryana|uttar pradesh|bihar|west bengal|odisha|madhya pradesh|jharkhand|chhattisgarh|assam)\b/)
  if (stateMatch) entities.location = stateMatch[1]

  const seasonMatch = lower.match(/\b(kharif|rabi|zaid|summer|winter|monsoon|spring|autumn)\b/)
  if (seasonMatch) entities.season = seasonMatch[1]

  const soilMatch = lower.match(/\b(sandy|clay|loamy|silty|peaty|alluvial|black|red|laterite)\b/)
  if (soilMatch) entities.soil = soilMatch[1]

  const areaMatch = lower.match(/(\d+)\s*(acre|hectare|ha)/)
  if (areaMatch) entities.area = areaMatch[1]

  return entities
}

export async function detectIntent(message: string): Promise<IntentResult> {
  const lower = message.toLowerCase().trim()

  if (lower.length < 2) {
    return { intent: 'UNKNOWN', confidence: 0, entities: {}, reasoning: 'Message too short' }
  }

  const scores: { intent: Intent; score: number; matches: string[] }[] = []

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matches: string[] = []
    let score = 0

    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        matches.push(keyword)
        score += keyword.length / lower.length
      }
    }

    if (matches.length > 0) {
      scores.push({ intent: intent as Intent, score: Math.min(score, 1), matches })
    }
  }

  scores.sort((a, b) => b.score - a.score)

  if (scores.length === 0) {
    if (lower.includes('?')) {
      return { intent: 'GENERAL_AGRI', confidence: 0.4, entities: extractEntities(message), reasoning: 'Question detected, classifying as general agriculture' }
    }
    return { intent: 'UNKNOWN', confidence: 0.2, entities: {}, reasoning: 'No agriculture keywords matched' }
  }

  const top = scores[0]
  const confidence = Math.min(top.score + 0.1, 0.95)

  const entities = extractEntities(message)

  const reasoning = `Matched keywords: ${top.matches.join(', ')}`

  return { intent: top.intent, confidence, entities, reasoning }
}
