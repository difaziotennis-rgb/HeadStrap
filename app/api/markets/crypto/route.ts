import { NextResponse } from 'next/server'

// Top 2 cryptos + one significant mover
const CRYPTO_IDS = [
  'bitcoin',      // BTC - Top 1
  'ethereum',     // ETH - Top 2
  'solana',       // SOL - Significant mover
]

export async function GET() {
  try {
    // Using CoinGecko API (free, no key required for basic usage)
    const ids = CRYPTO_IDS.join(',')
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`
    
    const response = await fetch(url, {
      next: { revalidate: 60 } // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error('Failed to fetch crypto data')
    }

    const data = await response.json()
    
    // Get additional info for significant movers
    const marketDataUrl = `https://api.coingecko.com/api/v3/coins/markets?ids=${ids}&vs_currency=usd&order=market_cap_desc&per_page=3&page=1&sparkline=false&price_change_percentage=24h`
    const marketResponse = await fetch(marketDataUrl, {
      next: { revalidate: 60 }
    })
    
    let marketData: any = {}
    if (marketResponse.ok) {
      const marketDataArray = await marketResponse.json()
      marketDataArray.forEach((coin: any) => {
        marketData[coin.id] = coin
      })
    }
    
    const cryptos = CRYPTO_IDS.map((id) => {
      const priceData = data[id]
      const marketInfo = marketData[id]
      
      if (!priceData) return null

      const price = priceData.usd || 0
      const change24h = priceData.usd_24h_change || 0
      const volume24h = priceData.usd_24h_vol || 0
      
      // Format name
      const nameMap: Record<string, string> = {
        bitcoin: 'Bitcoin',
        ethereum: 'Ethereum',
        solana: 'Solana',
      }
      
      const symbolMap: Record<string, string> = {
        bitcoin: 'BTC',
        ethereum: 'ETH',
        solana: 'SOL',
      }
      
      return {
        id,
        symbol: symbolMap[id] || id.toUpperCase(),
        name: nameMap[id] || id,
        price,
        change24h,
        volume24h,
        marketCap: marketInfo?.market_cap || 0,
        lastUpdated: priceData.last_updated_at || Date.now() / 1000,
        // Additional info for significant movers
        description: marketInfo?.description || null,
        priceChange24h: marketInfo?.price_change_percentage_24h || change24h,
      }
    }).filter(Boolean)

    return NextResponse.json({ cryptos })
  } catch (error: any) {
    console.error('Error fetching crypto:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch crypto data' },
      { status: 500 }
    )
  }
}
