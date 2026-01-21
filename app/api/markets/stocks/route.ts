import { NextResponse } from 'next/server'

// Top traded stocks, biggest companies, and significant movers
const STOCK_SYMBOLS = [
  // Top traded / Biggest companies
  'AAPL',   // Apple
  'MSFT',   // Microsoft
  'GOOGL',  // Google
  'AMZN',   // Amazon
  'NVDA',   // NVIDIA
  'META',   // Meta
  'TSLA',   // Tesla
  'JPM',    // JPMorgan
  'V',      // Visa
  'JNJ',    // Johnson & Johnson
  // Significant movers (add more as needed)
  'AMD',    // AMD
  'NFLX',   // Netflix
  'DIS',    // Disney
]

export async function GET() {
  try {
    // Using Yahoo Finance API (free, no key required)
    const symbols = STOCK_SYMBOLS.join(',')
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbols}?interval=1d&range=5d`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error('Failed to fetch stock data')
    }

    const data = await response.json()
    
    const stocks = STOCK_SYMBOLS.map((symbol, index) => {
      const chartData = data.chart?.result?.[index]
      if (!chartData) return null

      const meta = chartData.meta
      const quotes = chartData.indicators?.quote?.[0]
      const timestamps = chartData.timestamp || []
      
      // Get latest price
      const prices = quotes?.close || []
      const volumes = quotes?.volume || []
      const currentPrice = meta.regularMarketPrice || prices[prices.length - 1] || meta.previousClose
      const previousClose = meta.previousClose || prices[prices.length - 2] || currentPrice
      
      // Calculate change
      const change = currentPrice - previousClose
      const changePercent = previousClose ? ((change / previousClose) * 100) : 0
      
      // Get latest volume
      const latestVolume = volumes[volumes.length - 1] || meta.regularMarketVolume || 0
      
      return {
        symbol,
        name: meta.longName || symbol,
        price: currentPrice,
        previousClose,
        change,
        changePercent,
        volume: latestVolume,
        marketState: meta.marketState || 'CLOSED',
        currency: meta.currency || 'USD',
        timestamp: meta.regularMarketTime || Date.now() / 1000,
      }
    }).filter(Boolean)

    return NextResponse.json({ stocks })
  } catch (error: any) {
    console.error('Error fetching stocks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}
