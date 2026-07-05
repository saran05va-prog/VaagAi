import type { ActionDefinition, ActionResult, ToolContext } from '../types'

const actions = new Map<string, ActionDefinition>()

export class ActionRegistry {
  register(action: ActionDefinition): void {
    if (actions.has(action.name)) {
      throw new Error(`Action "${action.name}" is already registered`)
    }
    actions.set(action.name, action)
  }

  get(name: string): ActionDefinition | undefined {
    return actions.get(name)
  }

  getAll(): ActionDefinition[] {
    return Array.from(actions.values())
  }

  async execute(name: string, params: Record<string, unknown>, context: ToolContext): Promise<ActionResult> {
    const action = actions.get(name)
    if (!action) return { success: false, action: name, message: `Action "${name}" not found` }

    if (!action.validation(params)) {
      return { success: false, action: name, message: 'Invalid parameters', params }
    }

    try {
      return await action.handler(params, context)
    } catch (err) {
      return { success: false, action: name, message: String(err), params }
    }
  }

  getByPermission(permission: string): ActionDefinition[] {
    return this.getAll().filter(a => a.permissions.includes(permission))
  }

  getForRoute(route: string): ActionDefinition | undefined {
    return this.getAll().find(a => a.route === route)
  }
}

export const actionRegistry = new ActionRegistry()

export function registerAllActions(): void {
  actionRegistry.register({
    name: 'navigate',
    description: 'Navigate the user to a specific page in the application.',
    route: undefined,
    handler: async (params): Promise<ActionResult> => ({
      success: true, action: 'navigate', route: String(params.to || '/farm'), params, message: `Navigating to ${params.to}`,
    }),
    permissions: ['navigate'],
    validation: (params) => typeof params.to === 'string',
  })

  actionRegistry.register({
    name: 'createPlot',
    description: 'Create a new crop plot in the 3D farm.',
    handler: async (params): Promise<ActionResult> => ({
      success: true, action: 'createPlot', message: `Creating new plot for ${params.crop || 'crop'}`,
      params,
    }),
    permissions: ['farm:write'],
    validation: () => true,
  })

  actionRegistry.register({
    name: 'deletePlot',
    description: 'Delete a crop plot from the farm.',
    handler: async (params): Promise<ActionResult> => ({
      success: true, action: 'deletePlot', message: `Deleting plot ${params.plotId || params.name || ''}`,
      params,
    }),
    permissions: ['farm:write'],
    validation: (params) => typeof params.plotId === 'string' || typeof params.name === 'string',
  })

  actionRegistry.register({
    name: 'updatePlot',
    description: 'Update crop plot details like stage, health, or name.',
    handler: async (params): Promise<ActionResult> => ({
      success: true, action: 'updatePlot', message: `Updating plot ${params.plotId || ''}`,
      params,
    }),
    permissions: ['farm:write'],
    validation: (params) => typeof params.plotId === 'string',
  })

  actionRegistry.register({
    name: 'openEconomics',
    description: 'Open the economics calculator for a specific crop.',
    route: '/economics',
    handler: async (params): Promise<ActionResult> => ({
      success: true, action: 'openEconomics', route: '/economics', params,
      message: `Opening economics calculator for ${params.crop || 'crop'}`,
    }),
    permissions: ['navigate'],
    validation: () => true,
  })

  actionRegistry.register({
    name: 'openWeather',
    description: 'Open the weather page.',
    route: '/weather',
    handler: async (): Promise<ActionResult> => ({
      success: true, action: 'openWeather', route: '/weather', message: 'Opening weather page',
    }),
    permissions: ['navigate'],
    validation: () => true,
  })

  actionRegistry.register({
    name: 'openMarketPrices',
    description: 'Open the market prices page.',
    route: '/market',
    handler: async (): Promise<ActionResult> => ({
      success: true, action: 'openMarketPrices', route: '/market', message: 'Opening market prices',
    }),
    permissions: ['navigate'],
    validation: () => true,
  })

  actionRegistry.register({
    name: 'openCropRecommendation',
    description: 'Open the crop recommendations page filtered by a specific crop.',
    route: '/recommendations',
    handler: async (params): Promise<ActionResult> => ({
      success: true, action: 'openCropRecommendation', route: '/recommendations', params,
      message: `Opening crop recommendations${params.crop ? ` for ${params.crop}` : ''}`,
    }),
    permissions: ['navigate'],
    validation: () => true,
  })

  actionRegistry.register({
    name: 'openCalendar',
    description: 'Open the farm calendar page.',
    route: '/calendar',
    handler: async (): Promise<ActionResult> => ({
      success: true, action: 'openCalendar', route: '/calendar', message: 'Opening calendar',
    }),
    permissions: ['navigate'],
    validation: () => true,
  })

  actionRegistry.register({
    name: 'openCropDoctor',
    description: 'Open the AI Crop Doctor for disease detection.',
    route: '/crop-doctor',
    handler: async (): Promise<ActionResult> => ({
      success: true, action: 'openCropDoctor', route: '/crop-doctor', message: 'Opening Crop Doctor',
    }),
    permissions: ['navigate'],
    validation: () => true,
  })

  actionRegistry.register({
    name: 'openSettings',
    description: 'Open the settings page.',
    route: '/settings',
    handler: async (): Promise<ActionResult> => ({
      success: true, action: 'openSettings', route: '/settings', message: 'Opening settings',
    }),
    permissions: ['navigate'],
    validation: () => true,
  })
}
