'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Coins, BarChart3, Twitter } from 'lucide-react'

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

interface Tweet {
  id: string
  text: string
  author: string
  authorHandle: string
  authorAvatar?: string
  timestamp: number
  likes?: number
  retweets?: number
  url: string
  topic?: string
}

export default function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch stocks, crypto, and tweets in parallel
      const [stocksRes, cryptosRes, tweetsRes] = await Promise.all([
        fetch('/api/markets/stocks'),
        fetch('/api/markets/crypto'),
        fetch('/api/markets/tweets'),
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

      if (tweetsRes.ok) {
        const tweetsData = await tweetsRes.json()
        setTweets(tweetsData.tweets || [])
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

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() / 1000 - timestamp))
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Dashboard</h1>
              {lastUpdated && (
                <p className="text-xs text-slate-500">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Stocks Section */}
        <section className="mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Stocks</h2>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Symbol</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Name</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Change</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Volume</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stocks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 sm:px-4 py-4 sm:py-6 text-center text-slate-500">
                        <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mx-auto mb-2 text-slate-400" />
                        <p className="text-xs sm:text-sm">Loading stock data...</p>
                      </td>
                    </tr>
                  ) : (
                    stocks.map((stock) => {
                    const isPositive = stock.change >= 0
                    const isMarketOpen = stock.marketState === 'REGULAR'
                    
                    return (
                      <tr key={stock.symbol} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                          <span className="font-mono font-semibold text-slate-900 text-xs sm:text-sm">{stock.symbol}</span>
                        </td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 hidden sm:table-cell">
                          <span className="text-slate-700 text-xs sm:text-sm truncate max-w-[120px]">{stock.name}</span>
                        </td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right">
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm">{formatPrice(stock.price)}</span>
                        </td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right">
                          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600" />
                            )}
                            <span className={`font-semibold text-xs sm:text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                            <span className={`text-[10px] sm:text-xs hidden sm:inline ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              ({isPositive ? '+' : ''}{formatPrice(stock.change)})
                            </span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right hidden md:table-cell">
                          <span className="text-slate-600 text-xs">{formatVolume(stock.volume)}</span>
                        </td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 hidden lg:table-cell">
                          <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
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
        <section className="mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
            <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Cryptocurrency</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {cryptos.map((crypto) => {
              const isPositive = crypto.change24h >= 0
              
              return (
                <div
                  key={crypto.id}
                  className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{crypto.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{crypto.symbol}</p>
                    </div>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    )}
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <div>
                      <p className="text-lg sm:text-xl font-bold text-slate-900">{formatPrice(crypto.price)}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className={`font-semibold text-xs sm:text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                      </span>
                      <span className="text-xs text-slate-500">24h</span>
                    </div>
                    
                    {crypto.marketCap > 0 && (
                      <div className="pt-1.5 sm:pt-2 border-t border-slate-200">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-slate-500">Market Cap:</span>
                          <span className="font-medium text-slate-700">{formatMarketCap(crypto.marketCap)}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm mt-0.5 sm:mt-1">
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

        {/* Top Tweets Section */}
        <section className="mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
            <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Top Tweets</h2>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {tweets.length === 0 ? (
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 text-center">
                <Twitter className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-xs sm:text-sm text-slate-500 mb-1">Twitter API integration needed</p>
                <p className="text-[10px] sm:text-xs text-slate-400">Add TWITTER_BEARER_TOKEN to environment variables</p>
              </div>
            ) : (
              tweets.slice(0, 3).map((tweet) => {
                const timeAgo = getTimeAgo(tweet.timestamp)
                
                return (
                  <a
                    key={tweet.id}
                    href={tweet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-all hover:border-slate-300"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {tweet.authorAvatar ? (
                        <img
                          src={tweet.authorAvatar}
                          alt={tweet.author}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">{tweet.author}</span>
                          <span className="text-[10px] sm:text-xs text-slate-500">@{tweet.authorHandle}</span>
                          <span className="text-[10px] sm:text-xs text-slate-400">·</span>
                          <span className="text-[10px] sm:text-xs text-slate-400">{timeAgo}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed line-clamp-3">{tweet.text}</p>
                        {(tweet.likes || tweet.retweets) && (
                          <div className="flex items-center gap-3 sm:gap-4 mt-2 text-[10px] sm:text-xs text-slate-500">
                            {tweet.retweets && (
                              <span>{tweet.retweets.toLocaleString()} retweets</span>
                            )}
                            {tweet.likes && (
                              <span>{tweet.likes.toLocaleString()} likes</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                )
              })
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
