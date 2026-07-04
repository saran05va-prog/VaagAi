import cron from 'node-cron'
import marketSyncService from '../services/marketData/marketSyncService'

let isRunning = false

async function runSync(jobName = 'market-sync') {
  if (isRunning) {
    console.log(`[Cron:${jobName}] Previous sync still running, skipping`)
    return { status: 'skipped' }
  }
  isRunning = true
  try {
    console.log(`[Cron:${jobName}] Starting...`)
    const result = await marketSyncService.runSync()
    console.log(`[Cron:${jobName}] Done — ${result.rowsFetched} rows, ${result.rowsAnomalous} anomalous, ${result.rowsAggregated} aggregated`)
    return result
  } finally {
    isRunning = false
  }
}

export function startMarketSyncCron() {
  // Daily at 21:00 IST (15:30 UTC)
  const schedule = process.env.MARKET_SYNC_CRON || '30 15 * * *'
  console.log(`[Cron] Market sync scheduled: ${schedule}`)

  cron.schedule(schedule, async () => {
    await runSync('market-sync-cron')
  }, {
    timezone: 'Asia/Kolkata',
  })
}

export async function manualTrigger() {
  return runSync('market-sync-manual')
}
