import { NextResponse } from 'next/server'
import {
  computeSwingMetrics,
  relativeStrength,
  type OhlcBar,
} from '@/lib/markets/indicators'
import { MARKET_WATCHLIST, YAHOO_HEADERS } from '@/lib/markets/watchlist'

function todayKeyET(): string {
  const now = new Date()
  const todayET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  return todayET.toISOString().split('T')[0]
}

function parseDailyBars(chartJson: any): OhlcBar[] {
  const result = chartJson?.chart?.result?.[0]
  if (!result) return []
  const ts: number[] = result.timestamp || []
  const q = result.indicators?.quote?.[0] || {}
  const bars: OhlcBar[] = []
  for (let i = 0; i < ts.length; i++) {
    const open = q.open?.[i]
    const high = q.high?.[i]
    const low = q.low?.[i]
    const close = q.close?.[i]
    if ([open, high, low, close].some((v) => v == null || Number.isNaN(v))) continue
    bars.push({
      timestamp: ts[i],
      open,
      high,
      low,
      close,
      volume: q.volume?.[i] || 0,
    })
  }
  return bars
}

function buildIntraday(
  intradayJson: any,
  currentPrice: number,
  latestVolume: number
): Array<{
  timestamp: number
  price: number
  volume: number
  high: number | null
  low: number | null
}> {
  const intradayChartData = intradayJson.chart?.result?.[0]
  if (!intradayChartData) return []

  const intradayQuotes = intradayChartData.indicators?.quote?.[0]
  const intradayTimestamps: number[] = intradayChartData.timestamp || []
  const intradayCloses: Array<number | null> = intradayQuotes?.close || []
  const intradayHighs: Array<number | null> = intradayQuotes?.high || []
  const intradayLows: Array<number | null> = intradayQuotes?.low || []
  const intradayVolumes: Array<number | null> = intradayQuotes?.volume || []

  let lastValidClose: number | null = null
  const processedData: any[] = []
  const todayKey = todayKeyET()

  intradayTimestamps.forEach((timestamp: number, index: number) => {
    const closePrice = intradayCloses[index]
    let price: number | null = null
    if (closePrice !== null && closePrice !== undefined && !isNaN(closePrice)) {
      price = closePrice
      lastValidClose = closePrice
    } else if (lastValidClose !== null) {
      price = lastValidClose
    } else {
      return
    }

    const date = new Date(timestamp * 1000)
    const dateET = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const dayKey = dateET.toISOString().split('T')[0]

    processedData.push({
      timestamp,
      price,
      volume: intradayVolumes[index] || 0,
      high: intradayHighs[index] || null,
      low: intradayLows[index] || null,
      dayKey,
    })
  })

  const dataByDay = new Map<string, any[]>()
  processedData.forEach((dataPoint) => {
    if (!dataByDay.has(dataPoint.dayKey)) dataByDay.set(dataPoint.dayKey, [])
    dataByDay.get(dataPoint.dayKey)!.push(dataPoint)
  })

  let lastTradingDay: string | null = null
  if (dataByDay.has(todayKey) && dataByDay.get(todayKey)!.length > 0) {
    lastTradingDay = todayKey
  } else {
    const sortedDays = Array.from(dataByDay.keys()).sort().reverse()
    let maxDataPoints = 0
    for (const [dayKey, dayData] of dataByDay.entries()) {
      if (dayData.length > maxDataPoints) {
        maxDataPoints = dayData.length
        lastTradingDay = dayKey
      }
    }
    if (!lastTradingDay || maxDataPoints < 20) {
      lastTradingDay = sortedDays[0] || sortedDays[1] || null
    }
  }

  let intradayData =
    lastTradingDay && dataByDay.has(lastTradingDay)
      ? dataByDay
          .get(lastTradingDay)!
          .sort((a: any, b: any) => a.timestamp - b.timestamp)
          .map(({ dayKey, ...rest }: any) => rest)
      : processedData
          .map(({ dayKey, ...rest }: any) => rest)
          .sort((a: any, b: any) => a.timestamp - b.timestamp)

  if (intradayData.length > 0 && currentPrice) {
    const lastPoint = intradayData[intradayData.length - 1]
    const priceDiff = Math.abs(lastPoint.price - currentPrice)
    const nowTimestamp = Math.floor(Date.now() / 1000)
    if (nowTimestamp - lastPoint.timestamp > 300 || priceDiff / currentPrice > 0.001) {
      intradayData.push({
        timestamp: nowTimestamp,
        price: currentPrice,
        volume: latestVolume || 0,
        high: currentPrice,
        low: currentPrice,
      })
    }
  }

  return intradayData
}

function extractSessionPrint(
  intradayJson: any,
  previousClose: number,
  session: 'pre' | 'post'
): {
  price: number
  change: number
  changePercent: number
  asOf: number
} | null {
  const result = intradayJson?.chart?.result?.[0]
  if (!result) return null
  const window = result.meta?.currentTradingPeriod?.[session]
  if (!window?.start || !window?.end) return null

  const timestamps: number[] = result.timestamp || []
  const closes: Array<number | null> = result.indicators?.quote?.[0]?.close || []
  let last: { price: number; asOf: number } | null = null

  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i]
    const c = closes[i]
    if (c == null || Number.isNaN(c)) continue
    if (t >= window.start && t < window.end) {
      last = { price: c, asOf: t }
    }
  }

  if (!last || !previousClose) return null
  const change = last.price - previousClose
  return {
    price: last.price,
    change,
    changePercent: (change / previousClose) * 100,
    asOf: last.asOf,
  }
}

function downsampleDaily(bars: OhlcBar[], maxPoints = 90): OhlcBar[] {
  if (bars.length <= maxPoints) return bars
  const step = Math.ceil(bars.length / maxPoints)
  const out: OhlcBar[] = []
  for (let i = 0; i < bars.length; i += step) out.push(bars[i])
  const last = bars[bars.length - 1]
  if (out[out.length - 1]?.timestamp !== last.timestamp) out.push(last)
  return out
}

export async function GET() {
  try {
    const stocks: any[] = []

    for (let i = 0; i < MARKET_WATCHLIST.length; i++) {
      const { display, yahoo, kind, theme } = MARKET_WATCHLIST[i]
      try {
        if (i > 0) await new Promise((r) => setTimeout(r, 70))

        const dailyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=1d&range=1y`
        const intradayUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=5m&range=2d&includePrePost=true`

        const [dailyResponse, intradayResponse] = await Promise.all([
          fetch(dailyUrl, { headers: YAHOO_HEADERS, next: { revalidate: 120 } }),
          fetch(intradayUrl, { headers: YAHOO_HEADERS, next: { revalidate: 60 } }),
        ])

        if (!dailyResponse.ok) continue
        const dailyJson = await dailyResponse.json()
        const dailyChart = dailyJson.chart?.result?.[0]
        if (!dailyChart) continue

        const meta = dailyChart.meta
        const dailyBars = parseDailyBars(dailyJson)
        if (!dailyBars.length) continue

        const currentPrice =
          meta.regularMarketPrice || dailyBars[dailyBars.length - 1].close
        const previousClose =
          meta.chartPreviousClose ||
          meta.previousClose ||
          dailyBars[dailyBars.length - 2]?.close ||
          currentPrice

        const change = currentPrice - previousClose
        const changePercent = previousClose ? (change / previousClose) * 100 : 0
        const latestVolume =
          meta.regularMarketVolume || dailyBars[dailyBars.length - 1].volume || 0

        let intradayData: any[] = []
        let preMarket: ReturnType<typeof extractSessionPrint> = null
        let postMarket: ReturnType<typeof extractSessionPrint> = null
        let marketState = meta.marketState || 'CLOSED'
        if (intradayResponse.ok) {
          const intradayJson = await intradayResponse.json()
          intradayData = buildIntraday(intradayJson, currentPrice, latestVolume)
          preMarket = extractSessionPrint(intradayJson, previousClose, 'pre')
          postMarket = extractSessionPrint(intradayJson, previousClose, 'post')
          const period = intradayJson?.chart?.result?.[0]?.meta?.currentTradingPeriod
          const nowSec = Math.floor(Date.now() / 1000)
          if (period?.pre && nowSec >= period.pre.start && nowSec < period.pre.end) {
            marketState = 'PRE'
          } else if (period?.regular && nowSec >= period.regular.start && nowSec < period.regular.end) {
            marketState = 'REGULAR'
          } else if (period?.post && nowSec >= period.post.start && nowSec < period.post.end) {
            marketState = 'POST'
          }
        }

        const swing = computeSwingMetrics(
          dailyBars,
          meta.fiftyTwoWeekHigh,
          meta.fiftyTwoWeekLow
        )

        // During premarket, surface the live pre print as the headline price.
        const displayPrice =
          marketState === 'PRE' && preMarket ? preMarket.price : currentPrice
        const displayChange =
          marketState === 'PRE' && preMarket ? preMarket.change : change
        const displayChangePercent =
          marketState === 'PRE' && preMarket ? preMarket.changePercent : changePercent

        stocks.push({
          symbol: display,
          yahooSymbol: yahoo,
          kind,
          theme,
          name: meta.longName || meta.shortName || display,
          price: displayPrice,
          previousClose,
          change: displayChange,
          changePercent: displayChangePercent,
          volume: latestVolume,
          dayHigh: meta.regularMarketDayHigh ?? null,
          dayLow: meta.regularMarketDayLow ?? null,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
          marketState,
          currency: meta.currency || 'USD',
          timestamp: meta.regularMarketTime || Date.now() / 1000,
          preMarket,
          postMarket,
          intradayData,
          dailyData: downsampleDaily(dailyBars, 100).map((b) => ({
            timestamp: b.timestamp,
            price: b.close,
            volume: b.volume,
            high: b.high,
            low: b.low,
          })),
          swing,
        })
      } catch (error: any) {
        console.error(`Error fetching ${display}:`, error.message)
      }
    }

    const qqq = stocks.find((s) => s.symbol === 'QQQ')
    const enriched = stocks.map((s) => {
      const rs21 = relativeStrength(s.swing?.ret21d ?? null, qqq?.swing?.ret21d ?? null)
      const rs63 = relativeStrength(s.swing?.ret63d ?? null, qqq?.swing?.ret63d ?? null)
      return {
        ...s,
        rs21vsQqq: rs21,
        rs63vsQqq: rs63,
      }
    })

    if (!enriched.length) {
      return NextResponse.json(
        { error: 'Failed to fetch stock data', stocks: [], asOf: new Date().toISOString() },
        { status: 500 }
      )
    }

    return NextResponse.json({ stocks: enriched, asOf: new Date().toISOString() })
  } catch (error: any) {
    console.error('Error fetching stocks:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch stock data',
        stocks: [],
        asOf: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
