import { NextResponse } from 'next/server'

// Top traded stocks, biggest companies, and significant movers
const STOCK_SYMBOLS = [
  // Top traded / Biggest companies
  'AAPL',   // Apple
  'MSFT',   // Microsoft
  'NVDA',   // NVIDIA
  'TSLA',   // Tesla
  'QQQ',    // QQQ (always include)
  'MSTR',   // MicroStrategy (always include)
  'SMCI',   // Super Micro Computer - AI server company, significant mover with newsworthy story
]

export async function GET() {
  try {
    // Fetch stocks with a small delay to avoid rate limiting
    const stocks = []
    for (let i = 0; i < STOCK_SYMBOLS.length; i++) {
      const symbol = STOCK_SYMBOLS[i]
      try {
        // Add delay between requests (except first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Fetch daily data for main display
        const dailyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`
        
        // Fetch intraday data for last trading day (including pre-market and after-hours)
        // Use 2 days range to ensure we get the last complete trading day
        const intradayUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=2d&includePrePost=true`
        
        // Fetch both daily and intraday data
        const [dailyResponse, intradayResponse] = await Promise.all([
          fetch(dailyUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            next: { revalidate: 60 }
          }),
          fetch(intradayUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            next: { revalidate: 60 }
          })
        ])

        if (!dailyResponse.ok) {
          console.error(`Failed to fetch daily data for ${symbol}: ${dailyResponse.status}`)
          continue
        }

        const dailyData = await dailyResponse.json()
        const dailyChartData = dailyData.chart?.result?.[0]
        
        if (!dailyChartData) {
          console.error(`No daily chart data for ${symbol}`)
          continue
        }

        const meta = dailyChartData.meta
        const dailyQuotes = dailyChartData.indicators?.quote?.[0]
        const dailyPrices = dailyQuotes?.close || []
        const currentPrice = meta.regularMarketPrice || meta.previousClose || dailyPrices[dailyPrices.length - 1]
        const previousClose = meta.previousClose || dailyPrices[dailyPrices.length - 2] || currentPrice
        
        if (!currentPrice || isNaN(currentPrice)) {
          console.error(`No valid price data for ${symbol}`, { currentPrice, previousClose })
          continue
        }
        
        // Calculate change
        const change = currentPrice - previousClose
        const changePercent = previousClose ? ((change / previousClose) * 100) : 0
        
        // Get latest volume
        const latestVolume = meta.regularMarketVolume || dailyQuotes?.volume?.[dailyQuotes.volume.length - 1] || 0
        
        // Fetch intraday data for last trading day (including pre-market and after-hours)
        let intradayData: any[] = []
        if (intradayResponse.ok) {
          const intradayJson = await intradayResponse.json()
          const intradayChartData = intradayJson.chart?.result?.[0]
          
          if (intradayChartData) {
            const intradayQuotes = intradayChartData.indicators?.quote?.[0]
            const intradayTimestamps = intradayChartData.timestamp || []
            const intradayPrices = intradayQuotes?.close || []
            const intradayVolumes = intradayQuotes?.volume || []
            const intradayHighs = intradayQuotes?.high || []
            const intradayLows = intradayQuotes?.low || []
            
            // Get the last trading day (most recent day with substantial data)
            // Group data points by day and get the day with the most data points
            const dataByDay = new Map<string, any[]>()
            
            intradayTimestamps.forEach((timestamp: number, index: number) => {
              if (intradayPrices[index] === null || isNaN(intradayPrices[index])) return
              
              const date = new Date(timestamp * 1000)
              const dayKey = date.toISOString().split('T')[0] // YYYY-MM-DD
              
              if (!dataByDay.has(dayKey)) {
                dataByDay.set(dayKey, [])
              }
              
              dataByDay.get(dayKey)!.push({
                timestamp,
                price: intradayPrices[index],
                volume: intradayVolumes[index] || 0,
                high: intradayHighs[index] || null,
                low: intradayLows[index] || null,
                hour: date.getHours(),
                minute: date.getMinutes(),
              })
            })
            
            // Find the day with the most data points (likely the complete trading day)
            // A full trading day should have 50+ data points (5-minute intervals over ~4+ hours)
            let lastTradingDay = null
            let maxDataPoints = 0
            
            for (const [dayKey, dayData] of dataByDay.entries()) {
              if (dayData.length > maxDataPoints) {
                maxDataPoints = dayData.length
                lastTradingDay = dayKey
              }
            }
            
            // If we found a day with substantial data, use it
            // Otherwise, use the most recent day
            if (!lastTradingDay || maxDataPoints < 20) {
              const sortedDays = Array.from(dataByDay.keys()).sort().reverse()
              lastTradingDay = sortedDays[0] || sortedDays[1]
            }
            
            if (lastTradingDay && dataByDay.has(lastTradingDay)) {
              // Get all data points for the selected trading day, sorted by timestamp
              intradayData = dataByDay.get(lastTradingDay)!
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(({ hour, minute, ...rest }) => rest) // Remove helper fields
            } else {
              // Fallback: use all available data, sorted by timestamp
              intradayData = intradayTimestamps
                .map((timestamp: number, index: number) => ({
                  timestamp,
                  price: intradayPrices[index] || null,
                  volume: intradayVolumes[index] || 0,
                  high: intradayHighs[index] || null,
                  low: intradayLows[index] || null,
                }))
                .filter((point: any) => point.price !== null && !isNaN(point.price))
                .sort((a, b) => a.timestamp - b.timestamp)
            }
          }
        }
          
          stocks.push({
            symbol,
            name: meta.longName || meta.shortName || symbol,
            price: currentPrice,
            previousClose,
            change,
            changePercent,
            volume: latestVolume,
            marketState: meta.marketState || 'CLOSED',
            currency: meta.currency || 'USD',
            timestamp: meta.regularMarketTime || Date.now() / 1000,
            intradayData, // Include intraday hourly data for today's chart
          })
      } catch (error: any) {
        console.error(`Error fetching ${symbol}:`, error.message)
        continue
      }
    }

    if (stocks.length === 0) {
      console.error('No stocks fetched successfully')
      return NextResponse.json(
        { error: 'Failed to fetch stock data', stocks: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({ stocks })
  } catch (error: any) {
    console.error('Error fetching stocks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data', stocks: [] },
      { status: 500 }
    )
  }
}
