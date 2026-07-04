import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GrowthStage = 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest'

export type SoilType = 'loamy' | 'clay' | 'sandy' | 'silty' | 'peaty'
export type IrrigationMethod = 'drip' | 'sprinkler' | 'flood' | 'center_pivot' | 'manual'
export type WeatherCondition = 'clear' | 'partly_cloudy' | 'cloudy' | 'light_rain' | 'heavy_rain' | 'thunderstorm' | 'fog' | 'hazy' | 'windy'

export interface SoilData {
  type: SoilType
  moisture: number
  ph: number
  nitrogen: number
  phosphorus: number
  potassium: number
  organicMatter: number
  temperature: number
}

export interface CropPlot {
  id: string
  name: string
  cropType: string
  x: number
  z: number
  width: number
  depth: number
  stage: GrowthStage
  health: number
  plantedDate: string
  expectedHarvest: string
  actualHarvestDate?: string
  notes?: string
  irrigationEnabled: boolean
  irrigationMethod: IrrigationMethod
  yieldEstimate: number
  actualYield?: number
  pestRisk: number
  waterStress: number
  nutrientDeficiency: string[]
  lastWatered?: string
  lastFertilized?: string
  fertilizerType?: string
  diseaseDetected?: string
  taskHistory: FarmTask[]
}

export interface FarmTask {
  id: string
  type: 'irrigate' | 'fertilize' | 'pesticide' | 'weed' | 'prune' | 'harvest' | 'inspect' | 'soil_test'
  description: string
  date: string
  completed: boolean
  completedBy?: string
  notes?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface SensorReading {
  plotId: string
  moisture: number
  temperature: number
  humidity: number
  soilPh: number
  lightLevel: number
  windSpeed: number
  rainfall: number
  timestamp: number
  batteryLevel: number
}

export interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  condition: WeatherCondition
  description: string
  precipitation: number
  precipitationChance: number
  uvIndex: number
  visibility: number
  pressure: number
  dewPoint: number
  lastUpdated: string
  forecast: DayForecast[]
}

export interface DayForecast {
  date: string
  tempHigh: number
  tempLow: number
  condition: WeatherCondition
  precipitationChance: number
  humidity: number
  windSpeed: number
}

export interface FarmEquipment {
  id: string
  name: string
  type: 'tractor' | 'drone' | 'irrigation_pump' | 'sensor' | 'sprayer' | 'harvester'
  status: 'active' | 'idle' | 'maintenance' | 'offline'
  batteryLevel?: number
  lastMaintenance: string
  nextMaintenance: string
}

export interface FinancialRecord {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  date: string
  description: string
  plotId?: string
}

export interface PlotInsight {
  plotId: string
  healthTrend: 'improving' | 'stable' | 'declining'
  waterEfficiency: number
  nutrientScore: number
  pestAlert: boolean
  harvestReadiness: number
  recommendation: string
}

export interface FarmState {
  farmName: string
  location: { lat: number; lon: number; name: string; timezone: string }
  totalArea: number
  cultivatedArea: number

  soil: SoilData
  crops: CropPlot[]
  selectedCrop: string | null

  weather: WeatherData | null
  weatherLoading: boolean
  weatherError: string | null
  weatherSyncEnabled: boolean

  sensors: SensorReading[]
  equipment: FarmEquipment[]
  finances: FinancialRecord[]
  insights: Record<string, PlotInsight>

  currentTime: Date
  isNight: boolean
  dayPhase: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night'

  editMode: boolean
  showGrid: boolean
  showLabels: boolean
  selectedTool: 'select' | 'move' | 'resize' | 'add' | 'delete'
  cameraMode: 'free' | 'top' | 'follow'
  uiPanel: 'none' | 'analytics' | 'equipment' | 'finances' | 'tasks' | 'soil'
  notificationCount: number

  setFarmName: (name: string) => void
  setLocation: (location: FarmState['location']) => void
  setTotalArea: (area: number) => void
  setSoil: (data: Partial<SoilData>) => void
  updateSoil: () => void

  addCrop: (crop: CropPlot) => void
  updateCrop: (id: string, data: Partial<CropPlot>) => void
  removeCrop: (id: string) => void
  selectCrop: (id: string | null) => void
  advanceStage: (id: string) => void
  addTask: (plotId: string, task: FarmTask) => void
  completeTask: (plotId: string, taskId: string) => void

  setWeather: (weather: WeatherData | null) => void
  setWeatherLoading: (loading: boolean) => void
  setWeatherError: (error: string | null) => void
  setWeatherSyncEnabled: (enabled: boolean) => void

  addSensorReading: (reading: SensorReading) => void
  updateEquipment: (id: string, data: Partial<FarmEquipment>) => void
  addEquipment: (equipment: FarmEquipment) => void
  addFinance: (record: FinancialRecord) => void
  updateInsight: (plotId: string, insight: PlotInsight) => void

  setCurrentTime: (time: Date) => void
  setEditMode: (mode: boolean) => void
  setShowGrid: (show: boolean) => void
  setShowLabels: (show: boolean) => void
  setSelectedTool: (tool: FarmState['selectedTool']) => void
  setCameraMode: (mode: FarmState['cameraMode']) => void
  setUiPanel: (panel: FarmState['uiPanel']) => void
  setNotificationCount: (count: number) => void
}

export const CROP_TYPES: Record<string, {
  name: string
  color: string
  fruitColor?: string
  leafColor: string
  stemColor: string
  icon: string
  waterNeeds: 'low' | 'medium' | 'high'
  daysToHarvest: number
  optimalTemp: { min: number; max: number }
  spacing: number
  rootDepth: number
  growthStages: Record<GrowthStage, { days: number; description: string }>
}> = {
  rice: {
    name: 'Rice', color: '#7BC67E', fruitColor: '#D4A843', waterColor: '#5CBF5E', stemColor: '#6B8E23',
    icon: '🌾', waterNeeds: 'high', daysToHarvest: 120, optimalTemp: { min: 20, max: 35 },
    spacing: 0.25, rootDepth: 0.3,
    growthStages: {
      seedling: { days: 20, description: 'Young seedlings establishing' },
      vegetative: { days: 50, description: 'Active tillering and leaf growth' },
      flowering: { days: 15, description: 'Panicle initiation and flowering' },
      fruiting: { days: 25, description: 'Grain filling and ripening' },
      harvest: { days: 10, description: 'Ready for harvest' },
    },
  },
  wheat: {
    name: 'Wheat', color: '#D4C4A8', fruitColor: '#C4A46C', stemColor: '#8B7D5B',
    icon: '🌾', waterNeeds: 'medium', daysToHarvest: 150, optimalTemp: { min: 15, max: 25 },
    spacing: 0.2, rootDepth: 0.4,
    growthStages: {
      seedling: { days: 25, description: 'Emergence and tillering' },
      vegetative: { days: 60, description: 'Stem elongation and leaf development' },
      flowering: { days: 20, description: 'Heading and pollination' },
      fruiting: { days: 30, description: 'Grain development' },
      harvest: { days: 15, description: 'Ripe and dry' },
    },
  },
  corn: {
    name: 'Corn', color: '#FFD700', fruitColor: '#DAA520', stemColor: '#556B2F',
    icon: '🌽', waterNeeds: 'high', daysToHarvest: 90, optimalTemp: { min: 18, max: 30 },
    spacing: 0.3, rootDepth: 0.6,
    growthStages: {
      seedling: { days: 15, description: 'Emergence and first leaves' },
      vegetative: { days: 35, description: 'Stalk growth and leaf canopy' },
      flowering: { days: 10, description: 'Tassel and silk emergence' },
      fruiting: { days: 20, description: 'Ear and kernel development' },
      harvest: { days: 10, description: 'Kernels at physiological maturity' },
    },
  },
  tomato: {
    name: 'Tomato', color: '#228B22', fruitColor: '#FF6347', stemColor: '#2F4F2F',
    icon: '🍅', waterNeeds: 'medium', daysToHarvest: 80, optimalTemp: { min: 18, max: 29 },
    spacing: 0.5, rootDepth: 0.4,
    growthStages: {
      seedling: { days: 15, description: 'Seedling establishment' },
      vegetative: { days: 25, description: 'Vine growth and trellising' },
      flowering: { days: 10, description: 'Flower cluster formation' },
      fruiting: { days: 20, description: 'Fruit set and ripening' },
      harvest: { days: 10, description: 'Peak harvest window' },
    },
  },
  potato: {
    name: 'Potato', color: '#3D6B1E', fruitColor: '#DAA520', stemColor: '#4A5D23',
    icon: '🥔', waterNeeds: 'medium', daysToHarvest: 100, optimalTemp: { min: 15, max: 20 },
    spacing: 0.35, rootDepth: 0.3,
    growthStages: {
      seedling: { days: 20, description: 'Sprout development' },
      vegetative: { days: 30, description: 'Foliage growth' },
      flowering: { days: 15, description: 'Flowering and tuber initiation' },
      fruiting: { days: 25, description: 'Tuber bulking' },
      harvest: { days: 10, description: 'Vine senescence, ready to dig' },
    },
  },
  chili: {
    name: 'Chili', color: '#228B22', fruitColor: '#DC143C', stemColor: '#2F4F2F',
    icon: '🌶️', waterNeeds: 'medium', daysToHarvest: 75, optimalTemp: { min: 20, max: 30 },
    spacing: 0.45, rootDepth: 0.35,
    growthStages: {
      seedling: { days: 15, description: 'Seedling growth' },
      vegetative: { days: 20, description: 'Branching and leaf development' },
      flowering: { days: 10, description: 'Flower bud formation' },
      fruiting: { days: 20, description: 'Fruit development and color change' },
      harvest: { days: 10, description: 'Continuous harvest phase' },
    },
  },
  cotton: {
    name: 'Cotton', color: '#90EE90', fruitColor: '#FFFAF0', stemColor: '#6B8E23',
    icon: '☁️', waterNeeds: 'low', daysToHarvest: 180, optimalTemp: { min: 20, max: 35 },
    spacing: 0.6, rootDepth: 0.7,
    growthStages: {
      seedling: { days: 25, description: 'Establishment' },
      vegetative: { days: 60, description: 'Main stem and branch growth' },
      flowering: { days: 30, description: 'Squares and flowers' },
      fruiting: { days: 45, description: 'Boll development' },
      harvest: { days: 20, description: 'Bolls open, ready for picking' },
    },
  },
  sugarcane: {
    name: 'Sugarcane', color: '#32CD32', stemColor: '#6B8E23',
    icon: '🎋', waterNeeds: 'high', daysToHarvest: 365, optimalTemp: { min: 20, max: 35 },
    spacing: 0.5, rootDepth: 0.5,
    growthStages: {
      seedling: { days: 45, description: 'Germination and tillering' },
      vegetative: { days: 180, description: 'Grand growth phase' },
      flowering: { days: 30, description: 'Flowering (may be suppressed)' },
      fruiting: { days: 60, description: 'Sugar accumulation' },
      harvest: { days: 50, description: 'Mature canes' },
    },
  },
  groundnut: {
    name: 'Groundnut', color: '#5A8C2E', fruitColor: '#CD853F', stemColor: '#4A7023',
    icon: '🥜', waterNeeds: 'medium', daysToHarvest: 120, optimalTemp: { min: 20, max: 30 },
    spacing: 0.3, rootDepth: 0.3,
    growthStages: {
      seedling: { days: 20, description: 'Emergence' },
      vegetative: { days: 35, description: 'Vegetative growth' },
      flowering: { days: 15, description: 'Peg formation' },
      fruiting: { days: 35, description: 'Pod development underground' },
      harvest: { days: 15, description: 'Maturity, ready to lift' },
    },
  },
  vegetables: {
    name: 'Mixed Veg', color: '#228B22', fruitColor: '#FF6B6B', stemColor: '#2D4F2D',
    icon: '🥬', waterNeeds: 'high', daysToHarvest: 60, optimalTemp: { min: 15, max: 25 },
    spacing: 0.35, rootDepth: 0.25,
    growthStages: {
      seedling: { days: 10, description: 'Germination' },
      vegetative: { days: 20, description: 'Leaf growth' },
      flowering: { days: 10, description: 'Flowering' },
      fruiting: { days: 10, description: 'Edible portion development' },
      harvest: { days: 10, description: 'Ready to pick' },
    },
  },
  fruits: {
    name: 'Orchard', color: '#228B22', fruitColor: '#FF6B6B', stemColor: '#4A3B2A',
    icon: '🍎', waterNeeds: 'medium', daysToHarvest: 180, optimalTemp: { min: 15, max: 30 },
    spacing: 2.0, rootDepth: 1.0,
    growthStages: {
      seedling: { days: 30, description: 'Sapling establishment' },
      vegetative: { days: 60, description: 'Branch and leaf canopy' },
      flowering: { days: 20, description: 'Blossom period' },
      fruiting: { days: 50, description: 'Fruit development' },
      harvest: { days: 20, description: 'Fruit ripening' },
    },
  },
}

const initialSoil: SoilData = {
  type: 'loamy',
  moisture: 65,
  ph: 6.5,
  nitrogen: 40,
  phosphorus: 35,
  potassium: 50,
  organicMatter: 3.5,
  temperature: 28,
}

const initialCrops: CropPlot[] = [
  {
    id: 'plot_1', name: 'Rice Field - North', cropType: 'rice',
    x: -5, z: -4, width: 5, depth: 4,
    stage: 'vegetative', health: 95, plantedDate: '2026-04-15', expectedHarvest: '2026-08-15',
    irrigationEnabled: true, irrigationMethod: 'flood', yieldEstimate: 5000,
    pestRisk: 15, waterStress: 10, nutrientDeficiency: [],
    lastWatered: '2026-07-01', lastFertilized: '2026-06-15', fertilizerType: 'NPK 20-10-10',
    taskHistory: [
      { id: 't1', text: 'Apply irrigation', date: '2026-07-01', completed: true, priority: 'high', task: 'irrigate' },
      { id: 't2', text: 'Check for pests', date: '2026-07-05', completed: false, priority: 'medium', task: 'inspect' },
    ],
  },
  {
    id: 'plot_2', name: 'Tomato Greenhouse', cropType: 'tomato',
    x: 2, z: -3, width: 4, depth: 3,
    stage: 'fruiting', health: 92, plantedDate: '2026-03-01', expectedHarvest: '2026-06-01',
    irrigationEnabled: true, irrigationMethod: 'drip', yieldEstimate: 2500,
    pestRisk: 25, waterStress: 5, nutrientDeficiency: ['calcium'],
    lastWatered: '2026-07-02', fertilizerType: 'Liquid seaweed',
    taskHistory: [
      { id: 't3', date: '2026-07-02', completed: true, priority: 'high', task: 'irrigate', desc: 'Drip irrigation' },
    ],
  },
  {
    id: 'plot_3', name: 'Corn Plot - East', cropType: 'corn',
    x: -4, z: 3, width: 4, depth: 5,
    stage: 'vegetative', health: 88, plantedDate: '2026-04-20', expectedHarvest: '2026-07-20',
    irrigationEnabled: true, irrigationMethod: 'sprinkler', yieldEstimate: 3500,
    pestRisk: 25, waterStress: 20, nutrientDeficiency: ['nitrogen'],
    lastWatered: '2026-06-28',
    taskHistory: [],
  },
  {
    id: 'plot_4', name: 'Wheat Field - West', cropType: 'wheat',
    x: 4, z: 2, width: 4, depth: 4,
    stage: 'flowering', health: 98, plantedDate: '2026-01-15', expectedHarvest: '2026-05-15',
    irrigationEnabled: false, irrigationMethod: 'manual', yieldEstimate: 4200,
    pestRisk: 5, waterStress: 30, nutrientDeficiency: [],
    taskHistory: [],
  },
  {
    id: 'plot_5', name: 'Vegetable Garden', cropType: 'vegetables',
    x: 0, z: 0, width: 3, depth: 3,
    stage: 'fruiting', health: 85, plantedDate: '2026-04-01', expectedHarvest: '2026-06-01',
    irrigationEnabled: true, irrigationMethod: 'drip', yieldEstimate: 1500,
    pestRisk: 35, waterStress: 15, nutrientDeficiency: ['potassium'],
    diseaseDetected: 'Early blight (minor)',
    taskHistory: [],
  },
]

const initialEquipment: FarmEquipment[] = [
  { id: 'eq_1', name: 'Main Tractor', type: 'tractor', status: 'active', lastMaintenance: '2026-06-01', nextMaintenance: '2026-09-01' },
  { id: 'eq_2', name: 'Surveillance Drone', type: 'drone', status: 'idle', batteryLevel: 85, lastMaintenance: '2026-06-15', nextMaintenance: '2026-07-15' },
  { id: 'eq_3', name: 'Irrigation Pump', type: 'irrigation_pump', status: 'active', lastMaintenance: '2026-05-20', nextMaintenance: '2026-08-20' },
  { id: 'eq_4', name: 'Soil Sensor Array', type: 'sensor', status: 'active', batteryLevel: 92, lastMaintenance: '2026-06-10', nextMaintenance: '2026-12-10' },
]

const initialFinances: FinancialRecord[] = [
  { id: 'f1', type: 'income', category: 'crop_sale', amount: 125000, date: '2026-05-15', description: 'Rice harvest sale - Q1' },
  { id: 'f2', type: 'expense', category: 'fertilizer', amount: 18500, date: '2026-04-10', description: 'NPK fertilizer purchase' },
  { id: 'f3', type: 'expense', category: 'irrigation', amount: 8500, date: '2026-06-01', description: 'Water bill - May' },
  { id: 'f4', type: 'income', category: 'subsidy', amount: 25000, date: '2026-04-20', description: 'Govt. farm subsidy' },
]

const updateSoilBasedOnTime = (soil: SoilData, date: Date): SoilData => {
  const hour = date.getHours()
  const month = date.getMonth()
  const isSummer = month >= 2 && month <= 5
  const isMonsoon = month >= 6 && month <= 9

  return {
    ...soil,
    temperature: isSummer ? 30 + Math.sin(hour * Math.PI / 12) * 5 : 24 + Math.sin(hour * Math.PI / 12) * 3,
    moisture: isMonsoon ? 75 + Math.random() * 10 : isSummer ? 40 + Math.random() * 15 : 55 + Math.random() * 15,
  }
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      farmName: 'Vaagai Smart Farm',
      location: { lat: 11.0168, lon: 76.9558, name: 'Coimbatore, Tamil Nadu, India', timezone: 'Asia/Kolkata' },
      totalArea: 5.5,
      cultivatedArea: 4.2,

      soil: initialSoil,
      crops: initialCrops,
      selectedCrop: null,

      weather: null,
      weatherLoading: false,
      weatherError: null,
      weatherSyncEnabled: true,

      sensors: [],
      equipment: initialEquipment,
      finances: initialFinances,
      insights: {},

      currentTime: new Date(),
      isNight: false,
      dayPhase: 'morning',

      editMode: false,
      showGrid: true,
      showLabels: true,
      selectedTool: 'select',
      cameraMode: 'free',
      uiPanel: 'none',
      notificationCount: 2,

      setFarmName: (name) => set({ farmName: name }),
      setLocation: (location) => set({ location }),
      setTotalArea: (area) => set({ totalArea: area }),
      setSoil: (data) => set((state) => ({ soil: { ...state.soil, ...data } })),
      updateSoil: () => set((state) => ({ soil: updateSoilBasedOnTime(state.soil, state.currentTime) })),

      addCrop: (crop) => set((state) => ({ crops: [...state.crops, crop] })),
      updateCrop: (id, data) => set((state) => ({
        crops: state.crops.map((c) => (c.id === id ? { ...c, ...data } : c)),
      })),
      removeCrop: (id) => set((state) => ({
        crops: state.crops.filter((c) => c.id !== id),
        selectedCrop: state.selectedCrop === id ? null : state.selectedCrop,
      })),
      selectCrop: (id) => set({ selectedCrop: id }),
      advanceStage: (id) => set((state) => ({
        crops: state.crops.map((c) => {
          if (c.id !== id) return c
          const stages: GrowthStage[] = ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest']
          const idx = stages.indexOf(c.stage)
          return idx < stages.length - 1 ? { ...c, stage: stages[idx + 1] } : c
        }),
      })),
      addTask: (plotId, task) => set((state) => ({
        crops: state.crops.map((c) =>
          c.id === plotId ? { ...c, taskHistory: [...c.taskHistory, task] } : c
        ),
      })),
      completeTask: (plotId, taskId) => set((state) => ({
        crops: state.crops.map((c) =>
          c.id === plotId ? {
            ...c,
            taskHistory: c.taskHistory.map((t) =>
              t.id === taskId ? { ...t, completed: true } : t
            ),
          } : c
        ),
      })),

      setWeather: (weather) => set({ weather }),
      setWeatherLoading: (loading) => set({ weatherLoading: loading }),
      setWeatherError: (error) => set({ weatherError: error }),
      setWeatherSyncEnabled: (enabled) => set({ weatherSyncEnabled: enabled }),

      addSensorReading: (reading) => set((state) => ({
        sensors: [...state.sensors.slice(-95), reading],
      })),
      updateEquipment: (id, data) => set((state) => ({
        equipment: state.equipment.map((eq) => eq.id === id ? { ...eq, ...data } : eq),
      })),
      addEquipment: (eq) => set((state) => ({ equipment: [...state.equipment, eq] })),
      addFinance: (record) => set((state) => ({ finances: [...state.finances, record] })),
      updateInsight: (plotId, insight) => set((state) => ({
        insights: { ...state.insights, [plotId]: insight },
      })),

      setCurrentTime: (time) => {
        const hour = time.getHours()
        const isNight = hour < 6 || hour > 19
        let dayPhase: FarmState['dayPhase']
        if (hour >= 5 && hour < 8) dayPhase = 'dawn'
        else if (hour >= 8 && hour < 11) dayPhase = 'morning'
        else if (hour >= 11 && hour < 14) dayPhase = 'noon'
        else if (hour >= 14 && hour < 17) dayPhase = 'afternoon'
        else if (hour >= 17 && hour < 20) dayPhase = 'dusk'
        else dayPhase = 'night'

        set({
          currentTime: time,
          isNight,
          dayPhase,
        })
      },

      setEditMode: (editMode) => set({ editMode }),
      setShowGrid: (showGrid) => set({ showGrid }),
      setShowLabels: (showLabels) => set({ showLabels }),
      setSelectedTool: (selectedTool) => set({ selectedTool }),
      setCameraMode: (cameraMode) => set({ cameraMode }),
      setUiPanel: (uiPanel) => set({ uiPanel }),
      setNotificationCount: (count) => set({ notificationCount: count }),
    }),
    {
      name: 'vaagai-farm-storage',
      partialize: (state) => ({
        farmName: state.farmName,
        location: state.location,
        totalArea: state.totalArea,
        cultivatedArea: state.cultivatedArea,
        soil: state.soil,
        crops: state.crops,
        selectedCrop: state.selectedCrop,
        editMode: state.editMode,
        showGrid: state.showGrid,
        showLabels: state.showLabels,
        selectedTool: state.selectedTool,
        weatherSyncEnabled: state.weatherSyncEnabled,
        equipment: state.equipment,
        finances: state.finances,
        insights: state.insights,
        sensors: state.sensors,
      }),
    }
  )
)