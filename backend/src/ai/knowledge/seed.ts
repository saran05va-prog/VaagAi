import type { KnowledgeDocument } from '../types'

export function seedKnowledge(): KnowledgeDocument[] {
  return [
    {
      id: 'crop-rice-001',
      title: 'Rice Cultivation Guide',
      content: `Rice is the staple food crop of India, grown across 43 million hectares. 
Key varieties include Basmati, IR-64, Sona Masoori, and Ponni.
Optimal temperature: 20-37°C. Requires 100-150cm annual rainfall.
Major growing states: West Bengal, Uttar Pradesh, Punjab, Tamil Nadu, Andhra Pradesh.
Sowing methods: Direct seeding (dry/wet), transplanting (manual/mechanical).
Kharif season: June-November. Rabi rice: November-April.
Fertilizer recommendation: 120:60:60 NPK kg/ha.
Common pests: Stem borer, Brown plant hopper, Leaf folder.
Common diseases: Blast, Bacterial leaf blight, Sheath rot.`,
      type: 'crop_guide',
      metadata: {
        crops: ['rice'],
        states: ['West Bengal', 'Uttar Pradesh', 'Punjab', 'Tamil Nadu', 'Andhra Pradesh'],
        season: 'kharif',
        tags: ['cultivation', 'irrigation', 'pest_management'],
        source: 'Indian Council of Agricultural Research',
        region: 'india',
      },
    },
    {
      id: 'crop-wheat-001',
      title: 'Wheat Farming Best Practices',
      content: `Wheat is the second most important food crop in India.
Key varieties: HD-2967, PBW-343, JW-3211, DBW-187.
Optimal temperature: 15-25°C. Requires 50-80cm rainfall.
Major growing states: Uttar Pradesh, Punjab, Haryana, Madhya Pradesh, Bihar.
Rabi season: October-November to March-April.
Seed rate: 100-125 kg/ha for timely sowing, 125-150 kg/ha for late sowing.
Fertilizer recommendation: 150:60:40 NPK kg/ha.
Irrigation: 4-6 irrigations depending on variety and soil type.
Common rusts: Brown rust, Yellow rust, Black rust.
Storage: Moisture content below 12% for safe storage.`,
      type: 'crop_guide',
      metadata: {
        crops: ['wheat'],
        states: ['Uttar Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Bihar'],
        season: 'rabi',
        tags: ['cultivation', 'irrigation', 'storage'],
        source: 'Indian Institute of Wheat and Barley Research',
        region: 'india',
      },
    },
    {
      id: 'soil-001',
      title: 'Soil Health Management',
      content: `Soil health is the foundation of productive agriculture.
Key soil types in India: Alluvial (43%), Black (15%), Red (18%), Laterite (8%), Arid (6%).
Ideal soil pH: 6.0-7.5 for most crops.
Organic matter: Should be above 1.5% for healthy soil.
Soil testing: Recommended every 2-3 years.
Green manuring: Dhaincha, Sunhemp, Cowpea add 50-80 kg N/ha.
Vermicompost: Apply 5-10 tonnes/ha for vegetable crops.
Biofertilizers: Rhizobium (pulses), Azospirillum (cereals), Phosphobacteria.
Soil conservation: Contour bunding, terrace farming, cover cropping.
Zero Budget Natural Farming (ZBNI): Increasingly popular in Andhra Pradesh and Karnataka.`,
      type: 'soil_management',
      metadata: {
        crops: [],
        states: [],
        season: '',
        tags: ['soil_health', 'soil_types', 'biofertilizers', 'conservation'],
        source: 'Indian Institute of Soil Science',
        region: 'india',
      },
    },
    {
      id: 'pest-001',
      title: 'Integrated Pest Management (IPM)',
      content: `IPM is an eco-friendly approach to pest control.
Principles: Prevention, monitoring, and control.
Cultural control: Crop rotation, intercropping, timely sowing.
Mechanical control: Light traps, pheromone traps, sticky traps.
Biological control: Trichogramma (egg parasitoid), Neem-based pesticides, Beauveria bassiana.
Chemical control: Use as last resort. Follow recommended dosages and safety intervals.
Economic Threshold Level (ETL): Action threshold for pesticide application.
Neem oil: Effective against aphids, whiteflies, and caterpillars. Mix 5ml/L with soap.
Panchagavya: Organic growth promoter and pest repellent.
Botanical pesticides: Neem, Garlic, Chili, Tobacco extracts.`,
      type: 'pest_management',
      metadata: {
        crops: [],
        states: [],
        season: '',
        tags: ['ipm', 'biological_control', 'organic_pesticides', 'neem'],
        source: 'National Centre for Integrated Pest Management',
        region: 'india',
      },
    },
    {
      id: 'fert-001',
      title: 'Fertilizer Management Guide',
      content: `Balanced fertilizer application is crucial for crop productivity.
Macronutrients: Nitrogen (N), Phosphorus (P), Potassium (K).
Secondary nutrients: Sulfur (S), Calcium (Ca), Magnesium (Mg).
Micronutrients: Zinc (Zn), Iron (Fe), Manganese (Mn), Copper (Cu), Boron (B), Molybdenum (Mo).
Urea: 46% N. Apply 2-3 splits for better efficiency.
DAP: 18-46-0. Apply as basal dose.
MOP: 0-0-60. Apply as basal or in splits.
SSP: 16% P2O5, also provides sulfur (12%).
Zinc deficiency: Common in rice-wheat system. Apply 25 kg/ha ZnSO4.
Soil test-based fertilization: Can reduce costs by 20-30% while maintaining yield.
Fertigation: Drip irrigation combined with fertilizer application increases efficiency by 30-40%.
Organic alternatives: FYM (Farm Yard Manure), compost, vermicompost, biofertilizers.`,
      type: 'fertilizer',
      metadata: {
        crops: [],
        states: [],
        season: '',
        tags: ['fertilizers', 'NPK', 'micronutrients', 'fertigation', 'organic'],
        source: 'Fertilizer Association of India',
        region: 'india',
      },
    },
    {
      id: 'scheme-pm-001',
      title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      content: `PM-KISAN provides income support of ₹6000 per year to all landholding farmer families.
Benefits: ₹2000 transferred every 4 months directly to bank accounts.
Eligibility: All landholding farmers, families with cultivable land.
Exclusions: Institutional landholders, farming professionals with high income.
Application: Online through PM-KISAN portal or through local Agriculture Department.
Required documents: Aadhaar card, land records, bank account details.
Payment status: Check on pmkisan.gov.in.
Over 11 crore farmers have benefited since launch in 2018-19.`,
      type: 'government_scheme',
      metadata: {
        crops: [],
        states: [],
        season: '',
        tags: ['income_support', 'direct_benefit_transfer', 'central_scheme'],
        source: 'Ministry of Agriculture and Farmers Welfare',
        region: 'india',
      },
    },
    {
      id: 'scheme-pm-002',
      title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      content: `PMFBY is a crop insurance scheme providing financial support to farmers.
Coverage: All food crops, oilseeds, and annual commercial/horticultural crops.
Premium: 2% for Kharif crops, 1.5% for Rabi crops, 5% for commercial/horticultural crops.
Sum insured: Equal to Scale of Finance per hectare.
Covered risks: Natural fire, lightning, storm, hailstorm, cyclone, flood, drought, pest attack.
Claim settlement: Directly to bank accounts within 2 months of harvest.
Enrollment: Through banks, insurance companies, or online portals.
Required: Aadhaar, land records, crop details, bank account.
Latest update: PMFBY 2.0 launched with faster claim settlement and tech integration.`,
      type: 'government_scheme',
      metadata: {
        crops: [],
        states: [],
        season: '',
        tags: ['insurance', 'crop_protection', 'risk_management', 'central_scheme'],
        source: 'Ministry of Agriculture and Farmers Welfare',
        region: 'india',
      },
    },
    {
      id: 'disease-rice-001',
      title: 'Rice Blast Disease Management',
      content: `Rice blast is one of the most destructive diseases worldwide.
Cause: Fungus Magnaporthe oryzae (Pyricularia oryzae).
Symptoms: Diamond-shaped lesions on leaves, neck blast causing panicle rot.
Conditions: High humidity (90%), moderate temperatures (25-28°C), excess nitrogen.
Management: 
- Resistant varieties (Improved Samba Mahsuri, Naveen)
- Seed treatment with Tricyclazole 75% WP @ 2g/kg seed
- Foliar spray: Tricyclazole 75% WP @ 1g/L or Isoprothiolane 40% EC @ 1.5ml/L
- Avoid excess nitrogen application
- Field sanitation - remove crop residues
Yield loss: Can range from 20-50% in severe cases.`,
      type: 'disease',
      metadata: {
        crops: ['rice'],
        states: [],
        season: 'kharif',
        tags: ['rice', 'blast', 'fungal_disease', 'management'],
        source: 'Central Rice Research Institute',
        region: 'india',
      },
    },
    {
      id: 'crop-tomato-001',
      title: 'Tomato Cultivation Guide',
      content: `Tomato is India's most important vegetable crop after potato.
Key varieties: Arka Vikas, Pusa Ruby, Arka Meghali, hybrid varieties (US 440, US 618).
Optimal temperature: 20-28°C. Grows well in loamy, well-drained soil.
Major producing states: Andhra Pradesh, Karnataka, Madhya Pradesh, Odisha.
Nursery: 500-600g seeds/ha. Seedlings ready in 25-30 days.
Transplanting: 60×45cm spacing. 10,000-12,000 plants per acre.
Fertilizer: 100:50:80 NPK kg/ha. Apply FYM 20-25 tonnes/ha.
Support: Staking reduces fruit rot and improves quality.
Harvesting: 65-80 days after transplanting. Yield: 25-30 tonnes/acre.
Post-harvest: Cool immediately. Store at 10-13°C.`,
      type: 'crop_guide',
      metadata: {
        crops: ['tomato'],
        states: ['Andhra Pradesh', 'Karnataka', 'Madhya Pradesh', 'Odisha'],
        season: 'kharif',
        tags: ['cultivation', 'nursery', 'harvesting'],
        source: 'Indian Institute of Horticultural Research',
        region: 'india',
      },
    },
    {
      id: 'faq-organic-001',
      title: 'Organic Farming Certification Process',
      content: `Organic certification in India follows NPOP (National Programme for Organic Production).
Conversion period: 2-3 years for annual crops, 3 years for perennial crops.
Certification bodies: APEDA accredited agencies (OneCert, Lacon, SGS India, IMO).
Process:
1. Application to certification body
2. Submission of organic farm plan
3. Inspection of farm and records
4. Soil and water testing
5. Review and certification
Documents needed: Land records, farm map, input records, sales records.
Cost: ₹10,000-50,000 depending on farm size and certification body.
Renewal: Annual inspection required.
Group certification: Small farmers can form groups for cost-effective certification.
India has over 2.7 million certified organic farmers (highest in the world).`,
      type: 'faq',
      metadata: {
        crops: [],
        states: [],
        season: '',
        tags: ['organic_farming', 'certification', 'NPOP', 'APEDA'],
        source: 'Agricultural and Processed Food Products Export Development Authority',
        region: 'india',
      },
    },
    {
      id: 'market-001',
      title: 'e-NAM (National Agriculture Market) Guide',
      content: `e-NAM is a pan-India electronic trading portal for agricultural commodities.
Launched: April 2016 by Ministry of Agriculture.
Mandis integrated: Over 1000 mandis across 21 states.
Commodities traded: 200+ including grains, vegetables, fruits, oilseeds.
Benefits: 
- Transparent price discovery through competitive bidding
- Single market access - trade from any mandi
- Quality certification before auction
- Immediate payment to farmers' bank accounts
How to participate: Farmers register at local APMC mandi with land records and Aadhaar.
Online: Farmers can view prices on enam.gov.in.
Current limitation: Unified market still evolving - inter-mandi trade not fully operational.
Future: Integration with farmers' produce organisations (FPOs) and warehouse-based trading.`,
      type: 'market_report',
      metadata: {
        crops: [],
        states: [],
        season: '',
        tags: ['e-market', 'APMC', 'price_discovery', 'digital_platform'],
        source: 'Ministry of Agriculture and Farmers Welfare',
        region: 'india',
      },
    },
    {
      id: 'soil-002',
      title: 'Soil Testing and Analysis Methods',
      content: `Regular soil testing is essential for balanced fertilization.
When to test: After crop harvest, 3-4 months after fertilizer application.
How to sample: Collect 15-20 subsamples in zigzag pattern from 15-20cm depth.
Sample size: 500g composite sample per 2-3 hectares.
Parameters tested:
- pH (1:2 soil water suspension, pH meter)
- EC (Electrical conductivity - measures soluble salts)
- Organic carbon (Walkley-Black method)
- Available N (Alkaline permanganate method)
- Available P (Olsen's method for neutral-alkaline, Bray's for acidic soils)
- Available K (Flame photometer with ammonium acetate extraction)
- Micronutrients (DTPA extraction + atomic absorption spectrophotometer)
Soil health card: Government provides free soil testing under Soil Health Card scheme.
Frequency: Every 2-3 years recommended.
Benefits: 20-30% reduction in fertilizer costs, 10-15% yield increase.`,
      type: 'soil_management',
      metadata: {
        crops: [],
        states: [],
        season: '',
        tags: ['soil_testing', 'soil_health_card', 'analysis', 'nutrients'],
        source: 'Indian Institute of Soil Science',
        region: 'india',
      },
    },
  ]
}
