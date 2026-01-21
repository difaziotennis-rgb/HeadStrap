'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Coins, BarChart3 } from 'lucide-react'

interface Stock {
  symbol: string
  name: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  marketState: string
  currency: string
}

interface Crypto {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  priceChange24h: number
}

export default function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch stocks and crypto in parallel
      const [stocksRes, cryptosRes] = await Promise.all([
        fetch('/api/markets/stocks'),
        fetch('/api/markets/crypto'),
      ])

      if (stocksRes.ok) {
        const stocksData = await stocksRes.json()
        setStocks(stocksData.stocks || [])
      } else {
        const errorData = await stocksRes.json().catch(() => ({}))
        console.error('Stocks API error:', errorData)
        setStocks([])
      }

      if (cryptosRes.ok) {
        const cryptosData = await cryptosRes.json()
        setCryptos(cryptosData.cryptos || [])
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching market data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`
    return volume.toFixed(0)
  }

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`
    return `$${cap.toFixed(0)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Loading market data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              {lastUpdated && (
                <p className="text-sm text-slate-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stocks Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-6 w-6 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-900">Stocks</h2>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Change</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Volume</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stocks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
                        <p>Loading stock data...</p>
                      </td>
                    </tr>
                  ) : (
                    stocks.map((stock) => {
                    const isPositive = stock.change >= 0
                    const isMarketOpen = stock.marketState === 'REGULAR'
                    
                    return (
                      <tr key={stock.symbol} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-slate-900">{stock.symbol}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700">{stock.name}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-slate-900">{formatPrice(stock.price)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPositive ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                            <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              ({isPositive ? '+' : ''}{formatPrice(stock.change)})
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-slate-600 text-sm">{formatVolume(stock.volume)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isMarketOpen 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {isMarketOpen ? 'Open' : 'Closed'}
                          </span>
                        </td>
                      </tr>
                    )
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Crypto Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Coins className="h-6 w-6 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-900">Cryptocurrency</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cryptos.map((crypto) => {
              const isPositive = crypto.change24h >= 0
              
              return (
                <div
                  key={crypto.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{crypto.name}</h3>
                      <p className="text-sm text-slate-500 font-mono">{crypto.symbol}</p>
                    </div>
                    {isPositive ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatPrice(crypto.price)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                      </span>
                      <span className="text-sm text-slate-500">24h</span>
                    </div>
                    
                    {crypto.marketCap > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Market Cap:</span>
                          <span className="font-medium text-slate-700">{formatMarketCap(crypto.marketCap)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-slate-500">24h Volume:</span>
                          <span className="font-medium text-slate-700">{formatMarketCap(crypto.volume24h)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Placeholder for future sections */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 text-center">
            More sections coming soon...
          </p>
        </div>
      </main>
    </div>
  )
}
