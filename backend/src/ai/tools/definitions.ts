import { toolRegistry } from './registry'
import { retriever } from '../rag/retriever'
import type { ToolContext, ToolResult } from '../types'
import { aiConfig } from '../config'

export function registerAllTools(): void {
  toolRegistry.register({
    name: 'searchKnowledge',
    description: 'Search the agricultural knowledge base for information about crops, farming practices, diseases, pests, and more.',
    parameters: {
      query: { type: 'string', description: 'The search query', required: true },
      crop: { type: 'string', description: 'Filter by crop name (e.g., rice, wheat, tomato)', required: false },
      collection: { type: 'string', description: 'Filter by collection (crop_guides, soil_management, fertilizer, disease, faq)', required: false, enum: ['crop_guides', 'soil_management', 'fertilizer', 'disease', 'faq', 'government_schemes', 'market_reports'] },
    },
    handler: async (params, _ctx): Promise<ToolResult> => {
      const query = String(params.query || '')
      const crop = params.crop ? String(params.crop) : undefined
      const collection = params.collection ? String(params.collection) as any : undefined
      const results = await retriever.retrieve(query, { crop, collection }, 5)
      return {
        success: true,
        data: results.map(r => ({ content: r.chunk.content, title: r.chunk.metadata.title, source: r.chunk.metadata.source, score: r.score })),
      }
    },
    timeout: 5000,
    retries: 1,
  })

  toolRegistry.register({
    name: 'getWeather',
    description: 'Get current weather and forecast for a location.',
    parameters: {
      location: { type: 'string', description: 'City or region name (e.g., Coimbatore, Tamil Nadu)', required: true },
    },
    handler: async (params): Promise<ToolResult> => {
      const location = String(params.location || '')
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`)
        const geoData = await geoRes.json()
        const coords = geoData.results?.[0]
        if (!coords) return { success: false, data: null, error: `Location "${location}" not found`, latency: 0 }

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto`)
        const weather = await weatherRes.json()

        return { success: true, data: { location: coords.name, country: coords.country, current: weather.current, daily: weather.daily }, latency: 0 }
      } catch (err) {
        return { success: false, data: null, error: String(err), latency: 0 }
      }
    },
    timeout: 10000,
    retries: 1,
  })

  toolRegistry.register({
    name: 'getMarketPrice',
    description: 'Get current market prices for crops in a specific region.',
    parameters: {
      crop: { type: 'string', description: 'Crop name (e.g., tomato, rice, wheat, onion)', required: true },
      state: { type: 'string', description: 'State name (e.g., Tamil Nadu, Karnataka)', required: false },
    },
    handler: async (params): Promise<ToolResult> => {
      const crop = String(params.crop || '')
      return {
        success: true,
        data: { message: `Market price data for ${crop} would be fetched from AGMARKNET API`, crop, note: 'API integration requires AGMARKNET_API_KEY' },
        latency: 0,
      }
    },
    timeout: 5000,
    retries: 0,
  })

  toolRegistry.register({
    name: 'calculateFertilizer',
    description: 'Calculate recommended fertilizer dosage based on crop, soil type, and area.',
    parameters: {
      crop: { type: 'string', description: 'Crop name', required: true },
      soilType: { type: 'string', description: 'Soil type (loamy, sandy, clay, alluvial, black)', required: true, enum: ['loamy', 'sandy', 'clay', 'alluvial', 'black', 'red', 'laterite'] },
      area: { type: 'number', description: 'Area in hectares', required: true },
      soilNitrogen: { type: 'number', description: 'Soil nitrogen level (kg/ha)', required: false },
      soilPhosphorus: { type: 'number', description: 'Soil phosphorus level (kg/ha)', required: false },
      soilPotassium: { type: 'number', description: 'Soil potassium level (kg/ha)', required: false },
    },
    handler: async (params): Promise<ToolResult> => {
      const crop = String(params.crop || '')
      const soilType = String(params.soilType || '')
      const area = Number(params.area) || 0
      const N = Number(params.soilNitrogen) || 0
      const P = Number(params.soilPhosphorus) || 0
      const K = Number(params.soilPotassium) || 0

      const baseNPK: Record<string, { N: number; P: number; K: number }> = {
        rice: { N: 120, P: 60, K: 60 },
        wheat: { N: 140, P: 70, K: 70 },
        corn: { N: 150, P: 80, K: 80 },
        tomato: { N: 100, P: 50, K: 80 },
        potato: { N: 120, P: 80, K: 120 },
        sugarcane: { N: 250, P: 100, K: 100 },
        cotton: { N: 100, P: 50, K: 50 },
      }

      const recommended = baseNPK[crop] || { N: 100, P: 50, K: 50 }
      const nDeficit = Math.max(0, recommended.N - N)
      const pDeficit = Math.max(0, recommended.P - P)
      const kDeficit = Math.max(0, recommended.K - K)

      return {
        success: true,
        data: {
          crop,
          soilType,
          area,
          recommendation: {
            nitrogen: { recommended: recommended.N, deficit: nDeficit, dosage: `${(nDeficit * area).toFixed(1)} kg/ha` },
            phosphorus: { recommended: recommended.P, deficit: pDeficit, dosage: `${(pDeficit * area).toFixed(1)} kg/ha` },
            potassium: { recommended: recommended.K, deficit: kDeficit, dosage: `${(kDeficit * area).toFixed(1)} kg/ha` },
          },
        },
        latency: 0,
      }
    },
    timeout: 5000,
    retries: 0,
  })

  toolRegistry.register({
    name: 'recommendCrop',
    description: 'Get crop recommendations based on soil type, season, and location.',
    parameters: {
      soilType: { type: 'string', description: 'Soil type', required: true, enum: ['loamy', 'sandy', 'clay', 'alluvial', 'black', 'red', 'laterite'] },
      season: { type: 'string', description: 'Growing season', required: true, enum: ['kharif', 'rabi', 'zaid', 'summer', 'winter'] },
      location: { type: 'string', description: 'State or region in India', required: false },
    },
    handler: async (params): Promise<ToolResult> => {
      const soilType = String(params.soilType || '')
      const season = String(params.season || '')

      const recommendations: Record<string, Record<string, string[]>> = {
        loamy: { kharif: ['Rice', 'Cotton', 'Sugarcane', 'Maize'], rabi: ['Wheat', 'Gram', 'Mustard', 'Potato'], zaid: ['Watermelon', 'Cucumber', 'Fodder'] },
        sandy: { kharif: ['Groundnut', 'Pearl Millet', 'Pulses'], rabi: ['Wheat', 'Barley', 'Mustard'], zaid: ['Watermelon', 'Musk Melon'] },
        clay: { kharif: ['Rice', 'Sugarcane', 'Jute'], rabi: ['Wheat', 'Gram', 'Peas'], zaid: ['Rice', 'Vegetables'] },
        alluvial: { kharif: ['Rice', 'Maize', 'Sugarcane', 'Cotton'], rabi: ['Wheat', 'Potato', 'Mustard', 'Gram'], zaid: ['Vegetables', 'Fodder'] },
        black: { kharif: ['Cotton', 'Sugarcane', 'Groundnut', 'Soybean'], rabi: ['Wheat', 'Gram', 'Safflower'], zaid: ['Sunflower', 'Vegetables'] },
        red: { kharif: ['Groundnut', 'Pulses', 'Millets'], rabi: ['Wheat', 'Gram', 'Oilseeds'], zaid: ['Watermelon', 'Vegetables'] },
        laterite: { kharif: ['Rice', 'Tapioca', 'Cashew', 'Coconut'], rabi: ['Pulses', 'Vegetables'], zaid: ['Sweet Potato', 'Ginger'] },
      }

      const crops = recommendations[soilType]?.[season] || ['Consult local agricultural officer']
      return {
        success: true,
        data: { soilType, season, recommendedCrops: crops, note: 'These are general recommendations. Consult local experts for site-specific advice.' },
        latency: 0,
      }
    },
    timeout: 5000,
    retries: 0,
  })

  toolRegistry.register({
    name: 'analyzeSoil',
    description: 'Analyze soil health based on provided parameters and get recommendations.',
    parameters: {
      ph: { type: 'number', description: 'Soil pH level (0-14)', required: false },
      nitrogen: { type: 'number', description: 'Nitrogen level (kg/ha)', required: false },
      phosphorus: { type: 'number', description: 'Phosphorus level (kg/ha)', required: false },
      potassium: { type: 'number', description: 'Potassium level (kg/ha)', required: false },
      organicMatter: { type: 'number', description: 'Organic matter percentage', required: false },
    },
    handler: async (params): Promise<ToolResult> => {
      const { ph, nitrogen, phosphorus, potassium, organicMatter } = params as Record<string, number>
      const analysis: string[] = []

      if (ph) {
        if (ph < 5.5) analysis.push('Soil is acidic. Apply lime to raise pH.')
        else if (ph > 7.5) analysis.push('Soil is alkaline. Use sulfur or organic matter to lower pH.')
        else analysis.push('Soil pH is optimal for most crops.')
      }
      if (nitrogen !== undefined && nitrogen < 50) analysis.push('Nitrogen level is low. Apply urea or organic manure.')
      if (phosphorus !== undefined && phosphorus < 30) analysis.push('Phosphorus level is low. Apply DAP or SSP.')
      if (potassium !== undefined && potassium < 40) analysis.push('Potassium level is low. Apply MOP or potash.')
      if (organicMatter !== undefined && organicMatter < 1.5) analysis.push('Organic matter is low. Add compost or green manure.')

      return { success: true, data: { analysis: analysis.length > 0 ? analysis : ['Soil appears balanced.'], parameters: { ph, nitrogen, phosphorus, potassium, organicMatter } }, latency: 0 }
    },
    timeout: 5000,
    retries: 0,
  })

  toolRegistry.register({
    name: 'calculateProfit',
    description: 'Estimate profit/loss for a crop based on inputs, yield, and market price.',
    parameters: {
      crop: { type: 'string', description: 'Crop name', required: true },
      area: { type: 'number', description: 'Area in hectares', required: true },
      yieldPerHa: { type: 'number', description: 'Expected yield per hectare (kg)', required: false },
      pricePerKg: { type: 'number', description: 'Expected market price per kg (₹)', required: false },
      costOfCultivation: { type: 'number', description: 'Total cost of cultivation per hectare (₹)', required: false },
    },
    handler: async (params): Promise<ToolResult> => {
      const crop = String(params.crop || '')
      const area = Number(params.area) || 0
      const yieldPerHa = Number(params.yieldPerHa) || 0
      const pricePerKg = Number(params.pricePerKg) || 0
      const costPerHa = Number(params.costOfCultivation) || 0

      const avgYield: Record<string, number> = { rice: 2500, wheat: 3500, corn: 3000, tomato: 15000, potato: 20000, sugarcane: 70000, cotton: 1500 }
      const avgPrice: Record<string, number> = { rice: 25, wheat: 22, corn: 20, tomato: 15, potato: 18, sugarcane: 3.5, cotton: 65 }
      const avgCost: Record<string, number> = { rice: 45000, wheat: 35000, corn: 40000, tomato: 80000, potato: 70000, sugarcane: 90000, cotton: 55000 }

      const y = yieldPerHa || avgYield[crop] || 3000
      const p = pricePerKg || avgPrice[crop] || 20
      const c = costPerHa || avgCost[crop] || 50000
      const totalRevenue = y * p * area
      const totalCost = c * area
      const profit = totalRevenue - totalCost

      return {
        success: true,
        data: {
          crop,
          area,
          yield: y,
          price: p,
          totalRevenue,
          totalCost,
          profit,
          profitMargin: ((profit / totalRevenue) * 100).toFixed(1) + '%',
          isProfitable: profit > 0,
        },
        latency: 0,
      }
    },
    timeout: 5000,
    retries: 0,
  })

  toolRegistry.register({
    name: 'searchGovernmentSchemes',
    description: 'Search for Indian government agricultural schemes and subsidies.',
    parameters: {
      query: { type: 'string', description: 'Search query for schemes', required: true },
      state: { type: 'string', description: 'Filter by state', required: false },
    },
    handler: async (params): Promise<ToolResult> => {
      const query = String(params.query || '')
      const results = await retriever.retrieve(query, { collection: 'government_schemes' as any }, 5)
      return {
        success: true,
        data: results.length > 0
          ? results.map(r => ({ scheme: r.chunk.metadata.title, details: r.chunk.content, source: r.chunk.metadata.source }))
          : [{ scheme: 'General', details: 'For specific scheme details, please visit https://www.myscheme.gov.in or contact your local agriculture office.', source: 'Government of India' }],
        latency: 0,
      }
    },
    timeout: 5000,
    retries: 0,
  })
}
