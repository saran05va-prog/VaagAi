export interface DiseaseInfo {
  id: string
  diseaseName: string
  scientificName: string
  severity: 'low' | 'medium' | 'high'
  confidence: number
  description: string
  causes: string[]
  symptoms: string[]
  organicTreatment: string[]
  chemicalTreatment: string[]
  treatmentSteps: { title: string; description: string; day: number }[]
  prevention: string[]
  recoveryTimeline: string
  spreadRisk: 'low' | 'medium' | 'high'
  similarDiseases: string[]
}

export const diseaseDatabase: Record<string, DiseaseInfo[]> = {
  rice: [
    {
      id: 'rice-blast',
      diseaseName: 'Rice Blast',
      scientificName: 'Magnaporthe oryzae',
      severity: 'high',
      confidence: 92,
      description: 'Rice blast is a devastating fungal disease that affects all above-ground parts of the rice plant. It causes lesions on leaves, nodes, panicles, and grains. The disease can reduce yields by up to 50-80% in severe cases.',
      causes: ['Fungal pathogen Magnaporthe oryzae', 'Prolonged leaf wetness (6-8 hours)', 'High humidity (>90%)', 'Excessive nitrogen fertilization', 'Dense planting reducing air circulation'],
      symptoms: ['Diamond-shaped lesions with gray centers and brown borders', 'White to gray-green spots on leaves', 'Lesions merging to kill entire leaves', 'Rotting at nodes (node blast)', 'Panicle blast - white or empty grains'],
      organicTreatment: ['Apply neem oil spray (5ml/L) every 7 days', 'Use Trichoderma viride bio-fungicide at 5g/L', 'Apply Pseudomonas fluorescens at 10g/L', 'Use compost tea as foliar spray', 'Apply cow urine solution (1:10 dilution)'],
      chemicalTreatment: ['Spray Tricyclazole 75% WP at 0.6g/L', 'Apply Carbendazim 50% WP at 1g/L', 'Use Mancozeb 75% WP at 2g/L', 'Spray Isoprothiolane 40% EC at 1ml/L', 'Azoxystrobin 23% SC at 0.6ml/L'],
      treatmentSteps: [
        { title: 'Initial Treatment', description: 'Apply Tricyclazole or Neem oil spray to affected area', day: 1 },
        { title: 'Monitor & Re-spray', description: 'Check for new lesions; reapply fungicide if needed', day: 3 },
        { title: 'Soil Amendment', description: 'Reduce nitrogen fertilizer; apply potassium', day: 5 },
        { title: 'Second Treatment', description: 'Alternate fungicide (Carbendazim) to prevent resistance', day: 7 },
        { title: 'Final Inspection', description: 'Assess recovery; apply preventive spray if clear', day: 14 },
      ],
      prevention: ['Use resistant rice varieties (e.g., IR64, Swarna)', 'Avoid excessive nitrogen fertilizers', 'Maintain proper plant spacing (20x20cm)', 'Ensure good drainage in fields', 'Crop rotation with non-host crops', 'Remove and burn infected plant debris', 'Treat seeds with hot water (52°C for 10 min)'],
      recoveryTimeline: '2-3 weeks with proper treatment; yields may reduce by 20-30%',
      spreadRisk: 'high',
      similarDiseases: ['Brown Spot', 'Sheath Blight', 'Leaf Scald'],
    },
    {
      id: 'rice-brown-spot',
      diseaseName: 'Brown Spot',
      scientificName: 'Bipolaris oryzae',
      severity: 'medium',
      confidence: 87,
      description: 'Brown spot is a widespread rice disease that affects leaves, glumes, and grains. It is particularly damaging in nutrient-deficient soils. Severely infected grains become discolored and lightweight.',
      causes: ['Fungus Bipolaris oryzae', 'Soil nutrient deficiency (especially potassium)', 'Drought stress', 'Poor soil organic matter', 'Continuous rice monoculture'],
      symptoms: ['Small, circular brown spots with yellow halos', 'Spots enlarge and merge into irregular patches', 'Dark brown discoloration of grains', 'Premature leaf die-back', 'Reduced grain filling and weight'],
      organicTreatment: ['Apply well-decomposed FYM (farmyard manure)', 'Use potassium-rich organic fertilizers (wood ash)', 'Spray vermiwash at 1:10 dilution', 'Apply soured buttermilk spray (1:5 ratio)'],
      chemicalTreatment: ['Spray Mancozeb 75% WP at 2g/L', 'Apply Edifenphos 50% EC at 1ml/L', 'Use Propiconazole 25% EC at 0.5ml/L', 'Copper oxychloride 50% WP at 3g/L'],
      treatmentSteps: [
        { title: 'Nutrient Correction', description: 'Apply potassium fertilizer (KCl) at 40kg/acre', day: 1 },
        { title: 'Fungicide Application', description: 'Spray Mancozeb on affected plants', day: 1 },
        { title: 'Second Spray', description: 'Alternate with Propiconazole', day: 7 },
        { title: 'Soil Health', description: 'Add organic matter to improve soil', day: 10 },
      ],
      prevention: ['Maintain balanced NPK fertilization', 'Improve soil organic matter', 'Use certified disease-free seeds', 'Practice crop rotation', 'Ensure adequate irrigation during dry spells'],
      recoveryTimeline: '1-2 weeks with treatment; grain quality may still be affected',
      spreadRisk: 'medium',
      similarDiseases: ['Rice Blast', 'Sheath Rot', 'Grain Discoloration'],
    },
    {
      id: 'rice-sheath-blight',
      diseaseName: 'Sheath Blight',
      scientificName: 'Rhizoctonia solani',
      severity: 'high',
      confidence: 85,
      description: 'Sheath blight is a soil-borne fungal disease that attacks rice sheaths and leaves. It forms distinctive lesions on leaf sheaths and can cause significant yield losses of 20-50%.',
      causes: ['Soil-borne fungus Rhizoctonia solani', 'High humidity and dense canopy', 'Excessive nitrogen', 'Continuous flooding', 'Planting susceptible varieties'],
      symptoms: ['Water-soaked lesions on leaf sheaths near water line', 'Lesions enlarge with gray-white centers and brown borders', 'Lesions spread to upper sheaths and leaves', 'White powdery fungal growth on lesions', 'Premature plant death in severe cases'],
      organicTreatment: ['Apply Pseudomonad bio-control agents at 10g/L', 'Use Trichoderma harzianum at 5g/L', 'Apply neem cake at 150kg/hectare', 'Spray Bacillus subtilis solution'],
      chemicalTreatment: ['Spray Thifluzamide 24% SC at 0.6ml/L', 'Apply Azoxystrobin 23% SC at 0.6ml/L', 'Use Propiconazole 25% EC at 0.5ml/L', 'Carbendazim 50% WP at 1g/L'],
      treatmentSteps: [
        { title: 'Drain Field', description: 'Drain excess water to reduce humidity', day: 1 },
        { title: 'Apply Fungicide', description: 'Spray Thifluzamide at water line level', day: 1 },
        { title: 'Remove Infected Leaves', description: 'Cut and remove heavily infected sheaths', day: 2 },
        { title: 'Second Application', description: 'Alternate fungicide spray', day: 7 },
        { title: 'Monitor', description: 'Check for new lesion development', day: 14 },
      ],
      prevention: ['Use resistant varieties', 'Avoid dense planting', 'Balance nitrogen with potassium', 'Practice wet-dry irrigation', 'Remove weed hosts', 'Crop rotation with non-cereals'],
      recoveryTimeline: '3-4 weeks for recovery; severe cases may cause permanent yield loss',
      spreadRisk: 'high',
      similarDiseases: ['Bacterial Sheath Rot', 'Leaf Blast', 'Stem Rot'],
    },
  ],
  tomato: [
    {
      id: 'tomato-blight',
      diseaseName: 'Late Blight',
      scientificName: 'Phytophthora infestans',
      severity: 'high',
      confidence: 90,
      description: 'Late blight is a devastating water-mold disease that affects tomatoes and potatoes. It spreads rapidly in cool, wet weather and can destroy an entire crop within days if left untreated.',
      causes: ['Oomycete Phytophthora infestans', 'Cool temperatures (10-20°C)', 'High humidity (>90%)', 'Rain or overhead irrigation', 'Infected transplants or seeds'],
      symptoms: ['Water-soaked, irregular gray-green spots on leaves', 'White fuzzy growth on undersides of leaves', 'Dark brown lesions on stems', 'Brown, greasy spots on green fruits', 'Rapid wilting and plant collapse'],
      organicTreatment: ['Apply copper-based bio-fungicide (Bordeaux mixture)', 'Spray Bacillus subtilis at 10g/L', 'Use compost tea as preventive spray', 'Apply horsetail decoction (silica boost)'],
      chemicalTreatment: ['Spray Metalaxyl + Mancozeb at 2g/L', 'Apply Chlorothalonil 75% WP at 2g/L', 'Use Cymoxanil + Mancozeb at 2g/L', 'Spray Dimethomorph 50% SC at 0.5ml/L'],
      treatmentSteps: [
        { title: 'Immediate Treatment', description: 'Spray Metalaxyl-MZ on all plants immediately', day: 1 },
        { title: 'Remove Infected Parts', description: 'Prune and destroy all infected leaves/fruits', day: 1 },
        { title: 'Improve Airflow', description: 'Space plants; prune lower branches', day: 2 },
        { title: 'Re-spray', description: 'Apply Chlorothalonil as follow-up', day: 5 },
        { title: 'Final Application', description: 'Third spray with different mode of action', day: 10 },
      ],
      prevention: ['Use resistant varieties (e.g., Mountain Magic)', 'Practice crop rotation (3-4 years)', 'Avoid overhead irrigation', 'Mulch to prevent soil splash', 'Remove volunteer potato/tomato plants', 'Copper spray as preventive in wet season'],
      recoveryTimeline: 'If caught early, 2-3 weeks; advanced cases may kill plants',
      spreadRisk: 'high',
      similarDiseases: ['Early Blight', 'Septoria Leaf Spot', 'Bacterial Spot'],
    },
    {
      id: 'tomato-early-blight',
      diseaseName: 'Early Blight',
      scientificName: 'Alternaria solani',
      severity: 'medium',
      confidence: 88,
      description: 'Early blight is a common fungal disease that affects tomato foliage, stems, and fruits. It appears as characteristic target-like spots on older leaves and can cause significant defoliation.',
      causes: ['Fungus Alternaria solani', 'Warm, humid weather (24-30°C)', 'Poor air circulation', 'Infected plant debris in soil', 'Plants stressed by poor nutrition'],
      symptoms: ['Small dark spots that enlarge to target-like rings', 'Yellowing around leaf spots', 'Older leaves affected first', 'Dark, sunken lesions on stems near soil line', 'Dark, leathery spots on fruits near stem end'],
      organicTreatment: ['Apply neem oil (3ml/L) weekly', 'Spray Bacillus subtilis solution', 'Use garlic-pepper spray (10g/L garlic + 5g/L chili)', 'Apply compost tea as foliar feed'],
      chemicalTreatment: ['Spray Mancozeb 75% WP at 2g/L', 'Apply Copper oxychloride 50% WP at 3g/L', 'Use Azoxystrobin 23% SC at 0.6ml/L', 'Spray Chlorothalonil 75% WP at 2g/L'],
      treatmentSteps: [
        { title: 'Remove Infected Leaves', description: 'Prune lower affected leaves immediately', day: 1 },
        { title: 'Apply Fungicide', description: 'Spray Mancozeb or Copper oxychloride', day: 1 },
        { title: 'Mulch', description: 'Apply organic mulch to prevent soil splash', day: 2 },
        { title: 'Second Spray', description: 'Alternate fungicide application', day: 7 },
        { title: 'Nutrition', description: 'Apply balanced fertilizer to strengthen plants', day: 7 },
      ],
      prevention: ['Use disease-free seeds/transplants', 'Practice 2-3 year crop rotation', 'Stake plants for better air circulation', 'Water at soil level, not overhead', 'Remove plant debris at season end', 'Solarize soil before planting'],
      recoveryTimeline: '1-2 weeks with treatment; defoliated plants recover slowly',
      spreadRisk: 'medium',
      similarDiseases: ['Late Blight', 'Septoria Leaf Spot', 'Bacterial Speck'],
    },
  ],
  wheat: [
    {
      id: 'wheat-rust',
      diseaseName: 'Wheat Rust (Brown/Leaf Rust)',
      scientificName: 'Puccinia triticina',
      severity: 'high',
      confidence: 86,
      description: 'Leaf rust is one of the most common wheat diseases worldwide. It produces small, circular, orange-brown pustules on leaves and can cause yield losses of 5-20% in moderate infections.',
      causes: ['Fungus Puccinia triticina', 'Moderate temperatures (15-25°C)', 'High humidity and dew', 'Susceptible wheat varieties', 'Green bridge from volunteer wheat'],
      symptoms: ['Small orange-brown pustules on leaf surfaces', 'Pustules rupture to release rust-colored spores', 'Leaves turn yellow and die prematurely', 'Reduced grain filling and weight', 'Stunted plant growth'],
      organicTreatment: ['Spray soured buttermilk (1:10 dilution)', 'Apply neem oil (3ml/L) weekly', 'Use Trichoderma bio-formulation', 'Spray vermiwash at 1:5 ratio'],
      chemicalTreatment: ['Apply Propiconazole 25% EC at 0.5ml/L', 'Spray Tebuconazole 25.9% EC at 1ml/L', 'Use Mancozeb 75% WP at 2g/L', 'Spray Hexaconazole 5% SC at 2ml/L'],
      treatmentSteps: [
        { title: 'Emergency Spray', description: 'Apply Propiconazole immediately', day: 1 },
        { title: 'Remove Heavily Infected Leaves', description: 'Roguing severely infected plants', day: 2 },
        { title: 'Second Application', description: 'Alternate with Tebuconazole', day: 7 },
        { title: 'Monitor', description: 'Check for new pustules weekly', day: 14 },
      ],
      prevention: ['Plant resistant varieties (HD-2967, PBW-725)', 'Early sowing to avoid rust season', 'Avoid excessive nitrogen', 'Remove volunteer wheat plants', 'Fungicide seed treatment', 'Regional rust monitoring alerts'],
      recoveryTimeline: '2-3 weeks; early treatment critical for grain yield preservation',
      spreadRisk: 'high',
      similarDiseases: ['Stripe Rust (Yellow Rust)', 'Stem Rust', 'Powdery Mildew'],
    },
  ],
  corn: [
    {
      id: 'corn-northern-leaf-blight',
      diseaseName: 'Northern Corn Leaf Blight',
      scientificName: 'Exserohilum turcicum',
      severity: 'medium',
      confidence: 82,
      description: 'Northern corn leaf blight is a fungal disease that produces distinctive cigar-shaped lesions on corn leaves. It can cause significant yield losses if infection occurs before silking.',
      causes: ['Fungus Exserohilum turcicum', 'Cool, moist weather (18-25°C)', 'Prolonged dew or rain', 'Continuous corn cropping', 'Infected residue on soil surface'],
      symptoms: ['Large, elliptical gray-green to tan lesions (2-15cm)', 'Lesions have smooth, parallel margins', 'Lesions appear first on lower leaves', 'Lesions merge to blight entire leaves', 'Premature leaf death'],
      organicTreatment: ['Apply neem oil spray (3ml/L)', 'Use Trichoderma bio-agent', 'Spray cow urine (1:10 dilution)', 'Apply Pseudomonas fluorescens'],
      chemicalTreatment: ['Spray Propiconazole 25% EC at 0.5ml/L', 'Apply Azoxystrobin 23% SC at 0.6ml/L', 'Use Mancozeb 75% WP at 2g/L', 'Spray Pyraclostrobin 20% SC at 0.5ml/L'],
      treatmentSteps: [
        { title: 'Fungicide Application', description: 'Spray Propiconazole or Azoxystrobin', day: 1 },
        { title: 'Remove Infected Leaves', description: 'Strip lower infected leaves in light infections', day: 2 },
        { title: 'Second Spray', description: 'Alternate mode of action fungicide', day: 10 },
      ],
      prevention: ['Use resistant hybrids', 'Rotate with non-cereal crops', 'Bury crop residue through tillage', 'Avoid dense planting', 'Balanced fertility (avoid excess N)'],
      recoveryTimeline: '2-3 weeks; yield loss depends on growth stage at infection',
      spreadRisk: 'medium',
      similarDiseases: ['Southern Corn Leaf Blight', 'Gray Leaf Spot', 'Common Rust'],
    },
  ],
  chili: [
    {
      id: 'chili-leaf-curl',
      diseaseName: 'Leaf Curl Virus',
      scientificName: 'Tomato Leaf Curl New Delhi Virus (ToLCNDV)',
      severity: 'high',
      confidence: 78,
      description: 'Leaf curl virus is transmitted by whiteflies and causes severe stunting, leaf curling, and yield reduction in chili plants. Infected plants produce small, deformed fruits.',
      causes: ['Begomovirus transmitted by whiteflies', 'Whitefly (Bemisia tabaci) infestation', 'Infected seedlings or nearby infected crops', 'Hot, dry weather favoring whiteflies', 'Weed hosts (especially Parthenium, tobacco)'],
      symptoms: ['Severe upward curling of leaves', 'Leaf margins cup inward', 'Leaves become thick and leathery', 'Stunted plant growth', 'Reduced fruit set; small deformed fruits'],
      organicTreatment: ['Apply neem oil (5ml/L) weekly to repel whiteflies', 'Spray insecticidal soap at 5ml/L', 'Use yellow sticky traps for whiteflies', 'Apply garlic-chili pepper spray'],
      chemicalTreatment: ['Whitefly control: Imidacloprid 17.8% SL at 0.5ml/L', 'Spray Dimethoate 30% EC at 1ml/L', 'Apply Buprofezin 25% SC at 1ml/L', 'Use Thiamethoxam 25% WG at 0.5g/L'],
      treatmentSteps: [
        { title: 'Isolate Plants', description: 'Remove and destroy severely infected plants', day: 1 },
        { title: 'Whitefly Control', description: 'Apply Imidacloprid for vector control', day: 1 },
        { title: 'Install Traps', description: 'Place yellow sticky traps at 15 traps/acre', day: 1 },
        { title: 'Nutrition', description: 'Apply micronutrients (Zn, Fe) to boost immunity', day: 3 },
        { title: 'Repeat Spray', description: 'Alternate insecticide after 7 days', day: 7 },
      ],
      prevention: ['Use virus-resistant varieties', 'Use insect-proof net nurseries', 'Remove weed hosts', 'Plant barrier crops (e.g., maize)', 'Use reflective mulch', 'Regular whitefly monitoring with sticky traps', 'Remove infected plants immediately'],
      recoveryTimeline: 'Plants rarely fully recover; management focuses on limiting spread and harvesting what fruits remain',
      spreadRisk: 'high',
      similarDiseases: ['Chili Mosaic Virus', 'Thrips Damage', 'Herbicide Injury'],
    },
  ],
}

export function diagnoseDisease(plantName: string, symptoms: string[]): DiseaseInfo | null {
  const key = plantName.toLowerCase()
  const diseases = diseaseDatabase[key]
  if (!diseases || diseases.length === 0) return null

  let bestMatch: DiseaseInfo | null = null
  let highestScore = 0

  for (const disease of diseases) {
    const matchCount = disease.symptoms.filter((s) =>
      symptoms.some((us) => s.toLowerCase().includes(us.toLowerCase()))
    ).length
    const score = (matchCount / Math.max(disease.symptoms.length, symptoms.length)) * 100
    if (score > highestScore) {
      highestScore = score
      bestMatch = disease
    }
  }

  return bestMatch
}

export function getDiseaseById(id: string): DiseaseInfo | undefined {
  for (const diseases of Object.values(diseaseDatabase)) {
    const found = diseases.find((d) => d.id === id)
    if (found) return found
  }
  return undefined
}

export const allCropKeys = Object.keys(diseaseDatabase)
export const symptomOptions = [
  'yellowing', 'spots', 'wilting', 'mold', 'blight',
  'curling', 'lesions', 'rot', 'stunting', 'discoloration',
  'wilt', 'pustules', 'water-soaked', 'necrosis', 'deformation',
  'powdery', 'rust', 'mosaic', 'streak', 'die-back',
]

export const growthStages = [
  'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest',
]
