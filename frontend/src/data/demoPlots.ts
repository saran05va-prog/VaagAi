import type { CropPlot } from '../components/farm3d/farmStore'

export const DEMO_PLOTS: CropPlot[] = [
  {
    id: 'plot-1',
    name: 'Rice Field',
    cropType: 'rice',
    x: -4,
    z: -3,
    width: 6,
    depth: 5,
    stage: 'vegetative',
    health: 92,
    plantedDate: new Date().toISOString().slice(0, 10),
    expectedHarvest: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    irrigationEnabled: true,
    yieldEstimate: 4.2,
  },
  {
    id: 'plot-2',
    name: 'Tomato Patch',
    cropType: 'tomato',
    x: 3,
    z: 2,
    width: 5,
    depth: 5,
    stage: 'fruiting',
    health: 88,
    plantedDate: new Date().toISOString().slice(0, 10),
    expectedHarvest: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    irrigationEnabled: false,
    yieldEstimate: 12.5,
  },
]

export const DEMO_FARM = {
  name: 'Demo Farm',
  location: { lat: 11.0168, lon: 76.9558, name: 'Coimbatore, Tamil Nadu' },
  totalArea: 5.2,
}
