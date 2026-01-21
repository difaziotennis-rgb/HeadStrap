import { NextResponse } from 'next/server'

// Top traded stocks, biggest companies, and significant movers
const STOCK_SYMBOLS = [
  // Top traded / Biggest companies
  'AAPL',   // Apple
  'MSFT',   // Microsoft
  'NVDA',   // NVIDIA
  'TSLA',   // Tesla
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
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          next: { revalidate: 60 } // Cache for 60 seconds
        })

          if (!response.ok) {
            console.error(`Failed to fetch ${symbol}: ${response.status} ${response.statusText}`)
            continue
          }

          const data = await response.json()
          const chartData = data.chart?.result?.[0]
          
          if (!chartData) {
            console.error(`No chart data for ${symbol}`, JSON.stringify(data).substring(0, 200))
            continue
          }

          const meta = chartData.meta
          const quotes = chartData.indicators?.quote?.[0]
          
          // Get latest price
          const prices = quotes?.close || []
          const volumes = quotes?.volume || []
          const currentPrice = meta.regularMarketPrice || meta.previousClose || prices[prices.length - 1]
          const previousClose = meta.previousClose || prices[prices.length - 2] || currentPrice
          
          if (!currentPrice || isNaN(currentPrice)) {
            console.error(`No valid price data for ${symbol}`, { currentPrice, previousClose, prices })
            continue
          }
          
          // Calculate change
          const change = currentPrice - previousClose
          const changePercent = previousClose ? ((change / previousClose) * 100) : 0
          
          // Get latest volume
          const latestVolume = volumes[volumes.length - 1] || meta.regularMarketVolume || 0
          
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
