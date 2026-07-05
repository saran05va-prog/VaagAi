import { type DiseaseInfo } from '../data/diseaseData'

const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8002'

const CROP_NAME_MAP: Record<string, string> = {
  rice: 'rice',
  paddy: 'rice',
  wheat: 'wheat',
  corn: 'maize',
  maize: 'maize',
  tomato: 'tomato',
  chili: 'chili',
  chilli: 'chili',
  pepper: 'chili',
}

function mapSeverity(s: string): DiseaseInfo['severity'] {
  const sev = s.toLowerCase()
  if (sev === 'mild' || sev === 'low') return 'low'
  if (sev === 'moderate' || sev === 'medium') return 'medium'
  if (sev === 'severe' || sev === 'high') return 'high'
  return 'medium'
}

function mapSpreadRisk(severity: string): DiseaseInfo['spreadRisk'] {
  const s = severity.toLowerCase()
  if (s === 'severe' || s === 'high') return 'high'
  if (s === 'moderate' || s === 'medium') return 'medium'
  return 'low'
}

function mapRecoveryTimeline(severity: string): string {
  const s = severity.toLowerCase()
  if (s === 'severe' || s === 'high') return '3-4 weeks with intensive treatment'
  if (s === 'moderate' || s === 'medium') return '2-3 weeks with proper treatment'
  return '1-2 weeks with basic care'
}

export async function analyzeDiseaseWithPython(
  imageBase64: string,
  cropName: string,
  location = 'Unknown'
): Promise<DiseaseInfo | null> {
  try {
    const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
    const base64Data = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64

    const mappedCrop = CROP_NAME_MAP[cropName.toLowerCase()] || cropName.toLowerCase()

    const res = await fetch(`${PYTHON_API_URL}/api/disease/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Data,
        mime_type: mimeType,
        crop_name: mappedCrop,
        location,
      }),
    })

    if (!res.ok) {
      console.warn(`Python API returned ${res.status}, falling back to local DB`)
      return null
    }

    const data = await res.json()

    if (data.disease === 'Healthy') {
      return {
        id: 'healthy',
        diseaseName: 'Healthy Plant',
        scientificName: 'No disease detected',
        severity: 'low',
        confidence: Math.round(data.confidence * 100),
        description: 'Your plant appears healthy. No disease symptoms detected in the uploaded image.',
        causes: [],
        symptoms: [],
        organicTreatment: ['Continue regular care routine', 'Maintain balanced nutrition', 'Ensure adequate watering'],
        chemicalTreatment: [],
        treatmentSteps: [
          { title: 'Monitor', description: 'Continue regular monitoring of your crop', day: 1 },
          { title: 'Preventive Care', description: 'Apply neem oil as preventive measure', day: 7 },
          { title: 'Follow-up', description: 'Re-check plant health in 2 weeks', day: 14 },
        ],
        prevention: ['Regular monitoring of plants', 'Maintain good farm hygiene', 'Balanced fertilization schedule'],
        recoveryTimeline: 'Plant is healthy — no recovery needed',
        spreadRisk: 'low',
        similarDiseases: [],
      }
    }

    const recommendations = data.recommendations || {}
    const severity = data.severity || 'Moderate'
    const mappedSeverity = mapSeverity(severity)

    const symptoms = Array.isArray(recommendations.symptoms)
      ? recommendations.symptoms
      : ['Visible lesions on leaves', 'Yellowing of leaf tissue', 'Stunted growth observed']

    const causes = recommendations.cause
      ? [recommendations.cause]
      : ['Fungal or bacterial infection', 'Environmental stress factors']

    const organicTreatment = recommendations.organic_alternative
      ? [recommendations.organic_alternative]
      : ['Apply neem oil solution (5ml per liter water) weekly']

    const chemicalTreatment = Array.isArray(recommendations.treatment)
      ? recommendations.treatment
      : ['Consult local agriculture officer for specific treatment']

    const treatmentSteps = Array.isArray(recommendations.treatment)
      ? recommendations.treatment.map((t: string, i: number) => ({
          title: `Step ${i + 1}`,
          description: t,
          day: i === 0 ? 1 : (i + 1) * 3,
        }))
      : [
          { title: 'Initial Treatment', description: 'Apply treatment to affected area', day: 1 },
          { title: 'Monitor Progress', description: 'Check for improvement after treatment', day: 3 },
          { title: 'Follow-up', description: 'Reapply if needed and monitor recovery', day: 7 },
          { title: 'Final Inspection', description: 'Assess recovery and apply preventive measures', day: 14 },
        ]

    const prevention = Array.isArray(recommendations.prevention)
      ? recommendations.prevention
      : ['Use disease-resistant varieties', 'Practice crop rotation', 'Maintain proper plant spacing']

    return {
      id: `api_${Date.now()}`,
      diseaseName: data.disease || 'Unknown Disease',
      scientificName: data.disease ? `${data.disease} (detected)` : 'Unidentified',
      severity: mappedSeverity,
      confidence: Math.round((data.confidence || 0.7) * 100),
      description: `Analysis of ${cropName} detected ${data.disease || 'an unknown condition'} with ${mappedSeverity} severity. ${data.affected_ratio ? `Affected area: ${Math.round(data.affected_ratio * 100)}% of leaf surface.` : ''}`,
      causes,
      symptoms,
      organicTreatment,
      chemicalTreatment,
      treatmentSteps,
      prevention,
      recoveryTimeline: mapRecoveryTimeline(severity),
      spreadRisk: mapSpreadRisk(severity),
      similarDiseases: [],
    }
  } catch (err) {
    console.warn('Python API call failed:', err)
    return null
  }
}
