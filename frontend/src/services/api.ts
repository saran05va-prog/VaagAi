/**
 * Services API - Central API module for backend communication
 * This module provides all the API functions needed by legacy JSX components
 *
 * All functions use the centralized api instance from lib/api.ts
 */

import api, { getApiBaseUrl } from '../lib/api'

// Re-export getApiBaseUrl for components that need it
export { getApiBaseUrl }

// ==================== Weather API ====================

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  description: string
  location: string
}

export interface ForecastData {
  forecast: Array<{
    date: string
    weatherCode: number
    tempMax: number
    tempMin: number
    precipitation: number
    precipProbability: number
    windSpeed: number
  }>
}

export const getCurrentWeather = async (location?: string): Promise<{ data: WeatherData }> => {
  const res = await api.get('/api/weather/current', { params: { location } })
  return res.data
}

export const getWeatherForecast = async (location?: string, days = 7): Promise<{ data: ForecastData }> => {
  const res = await api.get('/api/weather/forecast', { params: { location, days } })
  return res.data
}

// ==================== Market API ====================

export interface MarketPrice {
  crop: string
  market_type: string
  price_per_kg: number
  min_price: number
  max_price: number
  modal_price_raw: number
  date: string
  state: string
  district: string
  market: string
  variety: string
}

export interface MarketPricesResponse {
  prices: MarketPrice[]
  count: number
  stats: {
    avgPrice: number
    minPrice: number
    maxPrice: number
  }
  lastUpdated: string
}

export const getMarketPrices = async (params?: { crop?: string; state?: string; limit?: number }): Promise<{ data: MarketPricesResponse }> => {
  const res = await api.get('/api/market/prices', { params })
  return res.data
}

export interface Crop {
  id: string
  name: string
  category: string
}

export const getCropsList = async (): Promise<{ data: { crops: Crop[] } }> => {
  const res = await api.get('/api/predict/crops/list')
  return res.data
}

// ==================== Economics API ====================

export interface ProfitMarginRequest {
  crop: string
  area_ha: number
  fertilizer_cost: number
  pesticide_cost: number
  labor_cost: number
  expected_yield_kg: number
  price_per_kg: number
}

export interface ProfitMarginResponse {
  total_cost: number
  total_revenue: number
  profit_margin: number
  profit_margin_pct: number
  breakdown: {
    fertilizer_cost: number
    pesticide_cost: number
    labor_cost: number
  }
}

export const getProfitMargin = async (data: ProfitMarginRequest): Promise<{ data: ProfitMarginResponse }> => {
  const res = await api.post('/api/economics/margin', data)
  return res.data
}

// ==================== Prediction API ====================

export interface CropPredictionRequest {
  nitrogen: number
  phosphorus: number
  potassium: number
  temperature: number
  humidity: number
  ph: number
  rainfall: number
}

export interface CropPredictionResponse {
  recommended_crop: string
  confidence: number
  alternatives: string[]
}

export interface YieldPredictionRequest {
  crop: string
  area_hectares: number
  nitrogen: number
  phosphorus: number
  potassium: number
  temperature: number
  humidity: number
  rainfall: number
}

export interface YieldPredictionResponse {
  predicted_yield_tonnes: number
  confidence_interval: [number, number]
}

export const predictCrop = async (data: CropPredictionRequest): Promise<{ data: CropPredictionResponse }> => {
  const res = await api.post('/api/predict/crop', data)
  return res.data
}

export const predictYield = async (data: YieldPredictionRequest): Promise<{ data: YieldPredictionResponse }> => {
  const res = await api.post('/api/predict/yield', data)
  return res.data
}

// ==================== Farm Profile API ====================

export interface FarmProfile {
  id: string
  userId: string
  name: string
  location: string
  totalArea: number
  soilType: string
  irrigationType: string
  createdAt: string
  updatedAt: string
}

export const getFarmProfiles = async (): Promise<{ data: FarmProfile[] }> => {
  const res = await api.get('/api/farms')
  return res.data
}

export const createFarmProfile = async (data: Partial<FarmProfile>): Promise<{ data: FarmProfile }> => {
  const res = await api.post('/api/farms', data)
  return res.data
}

export const updateFarmProfile = async (id: string, data: Partial<FarmProfile>): Promise<{ data: FarmProfile }> => {
  const res = await api.put(`/api/farms/${id}`, data)
  return res.data
}

export const deleteFarmProfile = async (id: string): Promise<{ data: { success: boolean } }> => {
  const res = await api.delete(`/api/farms/${id}`)
  return res.data
}

// ==================== Records API ====================

export interface YieldRecord {
  id: string
  farmId: string
  crop: string
  quantity: number
  unit: string
  date: string
  pricePerUnit: number
  notes?: string
  createdAt: string
}

export const getYieldRecords = async (farmId?: string): Promise<{ data: YieldRecord[] }> => {
  const res = await api.get('/api/records', { params: { farmId } })
  return res.data
}

export const createYieldRecord = async (data: Partial<YieldRecord>): Promise<{ data: YieldRecord }> => {
  const res = await api.post('/api/records', data)
  return res.data
}

export const updateYieldRecord = async (id: string, data: Partial<YieldRecord>): Promise<{ data: YieldRecord }> => {
  const res = await api.put(`/api/records/${id}`, data)
  return res.data
}

export const deleteYieldRecord = async (id: string): Promise<{ data: { success: boolean } }> => {
  const res = await api.delete(`/api/records/${id}`)
  return res.data
}

// ==================== Calendar API ====================

export interface CalendarEvent {
  id: string
  farmId: string
  title: string
  description?: string
  date: string
  type: 'sowing' | 'harvest' | 'irrigation' | 'fertilizer' | 'pesticide' | 'other'
  completed: boolean
  createdAt: string
}

export const getCalendar = async (farmId?: string, month?: string): Promise<{ data: CalendarEvent[] }> => {
  const res = await api.get('/api/calendar/events', { params: { farmId, month } })
  return res.data
}

// ==================== Stats API ====================

export interface StatsData {
  totalFarms: number
  totalCrops: number
  activeAlerts: number
  yieldTrend: number
}

export interface StatsBreakdown {
  crops: Array<{ name: string; count: number; percentage: number }>
  farms: Array<{ name: string; area: number }>
}

export interface StatsHistory {
  dates: string[]
  yields: number[]
}

export const getStats = async (): Promise<{ data: StatsData }> => {
  const res = await api.get('/api/stats')
  return res.data
}

export const getStatsBreakdown = async (farmId?: string): Promise<{ data: StatsBreakdown }> => {
  const res = await api.get('/api/stats/breakdown', { params: { farmId } })
  return res.data
}

export const getStatsHistory = async (farmId?: string, period = 'year'): Promise<{ data: StatsHistory }> => {
  const res = await api.get('/api/stats/history', { params: { farmId, period } })
  return res.data
}

export const getRagStats = async (): Promise<{ data: { totalQuestions: number; answeredToday: number; satisfaction: number } }> => {
  const res = await api.get('/api/ask/stats')
  return res.data
}

// ==================== Sensors API ====================

export interface SensorReading {
  id: string
  farmId: string
  sensorType: string
  value: number
  unit: string
  timestamp: string
}

export const getSensorReadings = async (farmId: string, sensorType?: string, limit = 50): Promise<{ data: SensorReading[] }> => {
  const res = await api.get('/api/sensors/readings', { params: { farmId, sensorType, limit } })
  return res.data
}

export const sendSensorData = async (farmId: string, data: { sensorType: string; value: number }): Promise<{ data: { success: boolean } }> => {
  const res = await api.post('/api/sensors/data', { farmId, ...data })
  return res.data
}

export const getWebhookUrl = async (farmId: string): Promise<{ data: { webhookUrl: string } }> => {
  const res = await api.get('/api/sensors/webhook', { params: { farmId } })
  return res.data
}

// ==================== Translation API ====================

export const translateText = async (text: string, targetLang: string, sourceLang = 'auto'): Promise<{ data: { translatedText: string; detectedLang: string } }> => {
  const res = await api.post('/api/translate', { text, targetLang, sourceLang })
  return res.data
}

export const detectLanguage = async (text: string): Promise<{ data: { language: string; confidence: number } }> => {
  const res = await api.post('/api/translate/detect', { text })
  return res.data
}

// ==================== User Profile & Learning API ====================

export interface UserProfile {
  id: string
  email: string
  name: string
  language: string
  preferences: Record<string, unknown>
}

export interface LearningStats {
  questionsAsked: number
  cropsTracked: number
  lastActive: string
}

export const getUserProfile = async (): Promise<{ data: UserProfile }> => {
  const res = await api.get('/api/profile')
  return res.data
}

export const getLearningStats = async (): Promise<{ data: LearningStats }> => {
  const res = await api.get('/api/profile/stats')
  return res.data
}

export const updateUserPreferences = async (preferences: Record<string, unknown>): Promise<{ data: UserProfile }> => {
  const res = await api.put('/api/profile/preferences', preferences)
  return res.data
}

export const submitFeedback = async (data: { message: string; rating?: number; type?: string }): Promise<{ data: { success: boolean } }> => {
  const res = await api.post('/api/feedback', data)
  return res.data
}

export const submitCorrection = async (data: { question: string; correctAnswer: string }): Promise<{ data: { success: boolean } }> => {
  const res = await api.post('/api/feedback/correction', data)
  return res.data
}

export const recordCropOutcome = async (data: { cropId: string; actualYield: number; quality: string; notes?: string }): Promise<{ data: { success: boolean } }> => {
  const res = await api.post('/api/crop-outcome', data)
  return res.data
}

export default {
  getApiBaseUrl,
  getCurrentWeather,
  getWeatherForecast,
  getMarketPrices,
  getCropsList,
  getProfitMargin,
  predictCrop,
  predictYield,
  getFarmProfiles,
  createFarmProfile,
  updateFarmProfile,
  deleteFarmProfile,
  getYieldRecords,
  createYieldRecord,
  updateYieldRecord,
  deleteYieldRecord,
  getCalendar,
  getStats,
  getStatsBreakdown,
  getStatsHistory,
  getRagStats,
  getSensorReadings,
  sendSensorData,
  getWebhookUrl,
  translateText,
  detectLanguage,
  getUserProfile,
  getLearningStats,
  updateUserPreferences,
  submitFeedback,
  submitCorrection,
  recordCropOutcome,
}