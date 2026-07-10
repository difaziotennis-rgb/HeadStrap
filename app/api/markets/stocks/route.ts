import { NextResponse } from 'next/server'

/** Display ticker → Yahoo Finance symbol */
const WATCHLIST: { display: string; yahoo: string }[] = [
  { display: 'NVDA', yahoo: 'NVDA' },
  { display: 'CLSK', yahoo: 'CLSK' },
  { display: 'TSLA', yahoo: 'TSLA' },
  { display: 'LMND', yahoo: 'LMND' },
  { display: 'MSTR', yahoo: 'MSTR' },
  { display: 'BTC', yahoo: 'BTC-USD' },
  { display: 'ETH', yahoo: 'ETH-USD' },
  { display: 'BMNR', yahoo: 'BMNR' },
  { display: 'MU', yahoo: 'MU' },
  { display: 'PLTR', yahoo: 'PLTR' },
  { display: 'GLD', yahoo: 'GLD' },
  { display: 'COPX', yahoo: 'COPX' },
  { display: 'QQQ', yahoo: 'QQQ' },
  { display: 'AAPL', yahoo: 'AAPL' },
  { display: 'AMZN', yahoo: 'AMZN' },
  { display: 'SPCX', yahoo: 'SPCX' },
  { display: 'BOT', yahoo: 'BOT' },
]

const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

function todayKeyET(): string {
  const now = new Date()
  const todayET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  return todayET.toISOString().split('T')[0]
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

export async function GET() {
  try {
    const stocks = []

    for (let i = 0; i < WATCHLIST.length; i++) {
      const { display, yahoo } = WATCHLIST[i]
      try {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 80))
        }

        const dailyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=1d&range=2d`
        const intradayUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=5m&range=2d&includePrePost=true`

        const [dailyResponse, intradayResponse] = await Promise.all([
          fetch(dailyUrl, { headers: YAHOO_HEADERS, next: { revalidate: 60 } }),
          fetch(intradayUrl, { headers: YAHOO_HEADERS, next: { revalidate: 60 } }),
        ])

        if (!dailyResponse.ok) {
          console.error(`Failed to fetch daily data for ${display}: ${dailyResponse.status}`)
          continue
        }

        const dailyData = await dailyResponse.json()
        const dailyChartData = dailyData.chart?.result?.[0]
        if (!dailyChartData) continue

        const meta = dailyChartData.meta
        const dailyQuotes = dailyChartData.indicators?.quote?.[0]
        const dailyPrices = dailyQuotes?.close || []
        const currentPrice =
          meta.regularMarketPrice || meta.previousClose || dailyPrices[dailyPrices.length - 1]
        const previousClose =
          meta.chartPreviousClose ||
          meta.previousClose ||
          dailyPrices[dailyPrices.length - 2] ||
          currentPrice

        if (!currentPrice || isNaN(currentPrice)) continue

        const change = currentPrice - previousClose
        const changePercent = previousClose ? (change / previousClose) * 100 : 0
        const latestVolume =
          meta.regularMarketVolume || dailyQuotes?.volume?.[dailyQuotes.volume.length - 1] || 0

        let intradayData: any[] = []
        if (intradayResponse.ok) {
          const intradayJson = await intradayResponse.json()
          intradayData = buildIntraday(intradayJson, currentPrice, latestVolume)
        }

        stocks.push({
          symbol: display,
          yahooSymbol: yahoo,
          name: meta.longName || meta.shortName || display,
          price: currentPrice,
          previousClose,
          change,
          changePercent,
          volume: latestVolume,
          dayHigh: meta.regularMarketDayHigh ?? null,
          dayLow: meta.regularMarketDayLow ?? null,
          marketState: meta.marketState || 'CLOSED',
          currency: meta.currency || 'USD',
          timestamp: meta.regularMarketTime || Date.now() / 1000,
          intradayData,
        })
      } catch (error: any) {
        console.error(`Error fetching ${display}:`, error.message)
      }
    }

    if (stocks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch stock data', stocks: [], asOf: new Date().toISOString() },
        { status: 500 }
      )
    }

    return NextResponse.json({ stocks, asOf: new Date().toISOString() })
  } catch (error: any) {
    console.error('Error fetching stocks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data', stocks: [], asOf: new Date().toISOString() },
      { status: 500 }
    )
  }
}
