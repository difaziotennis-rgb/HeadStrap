'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Coins, BarChart3, Newspaper, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'

interface HistoricalDataPoint {
  timestamp: number
  price: number
  volume: number
}

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
  historicalData?: HistoricalDataPoint[]
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

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

export default function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({})
  const [expandedStocks, setExpandedStocks] = useState<{ [key: string]: boolean }>({})

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch stocks, crypto, and news in parallel
      const [stocksRes, cryptosRes, newsRes] = await Promise.all([
        fetch('/api/markets/stocks'),
        fetch('/api/markets/crypto'),
        fetch('/api/markets/news'),
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

      if (newsRes.ok) {
        const newsData = await newsRes.json()
        setNews(newsData.articles || newsData.news || [])
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

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleStock = (symbol: string) => {
    setExpandedStocks(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }))
  }

  // Simple line chart component
  const StockChart = ({ data, isPositive }: { data: HistoricalDataPoint[], isPositive: boolean }) => {
    if (!data || data.length === 0) return null

    const width = 300
    const height = 80
    const padding = 8
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const prices = data.map(d => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth
      const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight
      return `${x},${y}`
    }).join(' ')

    const areaPoints = [
      `${padding},${height - padding}`,
      ...data.map((point, index) => {
        const x = padding + (index / (data.length - 1 || 1)) * chartWidth
        const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight
        return `${x},${y}`
      }),
      `${width - padding},${height - padding}`
    ].join(' ')

    return (
      <div className="w-full">
        <svg width={width} height={height} className="w-full max-w-full">
          <defs>
            <linearGradient id={`gradient-${isPositive ? 'green' : 'red'}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'} />
              <stop offset="100%" stopColor={isPositive ? 'rgba(34, 197, 94, 0)' : 'rgba(239, 68, 68, 0)'} />
            </linearGradient>
          </defs>
          <polygon
            points={areaPoints}
            fill={`url(#gradient-${isPositive ? 'green' : 'red'})`}
          />
          <polyline
            points={points}
            fill="none"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
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
          <button
            onClick={() => toggleSection('stocks')}
            className="flex items-center gap-1.5 mb-2 sm:mb-3 w-full text-left hover:opacity-80 transition-opacity"
          >
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Stocks</h2>
            {collapsedSections.stocks ? (
              <ChevronRight className="h-4 w-4 text-slate-500 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500 ml-auto" />
            )}
          </button>
          
          {!collapsedSections.stocks && (
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
                    const isExpanded = expandedStocks[stock.symbol]
                    
                    return (
                      <>
                        <tr 
                          key={stock.symbol} 
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => toggleStock(stock.symbol)}
                        >
                          <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-slate-400" />
                              )}
                              <span className="font-mono font-semibold text-slate-900 text-xs sm:text-sm">{stock.symbol}</span>
                            </div>
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
                        {isExpanded && stock.historicalData && stock.historicalData.length > 0 && (
                          <tr key={`${stock.symbol}-chart`} className="bg-slate-50">
                            <td colSpan={6} className="px-2 sm:px-3 py-3 sm:py-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-600 mb-1 font-medium">Daily Chart ({stock.historicalData.length} days)</p>
                                  <StockChart data={stock.historicalData} isPositive={isPositive} />
                                </div>
                                <div className="text-xs text-slate-500 space-y-0.5">
                                  <div>High: <span className="font-semibold text-slate-700">{formatPrice(Math.max(...stock.historicalData.map(d => d.price)))}</span></div>
                                  <div>Low: <span className="font-semibold text-slate-700">{formatPrice(Math.min(...stock.historicalData.map(d => d.price)))}</span></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  }))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </section>

        {/* Crypto Section */}
        <section className="mb-4 sm:mb-6">
          <button
            onClick={() => toggleSection('crypto')}
            className="flex items-center gap-1.5 mb-2 w-full text-left hover:opacity-80 transition-opacity"
          >
            <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Cryptocurrency</h2>
            {collapsedSections.crypto ? (
              <ChevronRight className="h-4 w-4 text-slate-500 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500 ml-auto" />
            )}
          </button>
          
          {!collapsedSections.crypto && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2">
            {cryptos.map((crypto) => {
              const isPositive = crypto.change24h >= 0
              
              return (
                <div
                  key={crypto.id}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold text-slate-900 text-xs truncate">{crypto.name}</h3>
                        <p className="text-[9px] text-slate-500 font-mono flex-shrink-0">{crypto.symbol}</p>
                      </div>
                    </div>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0 ml-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0 ml-0.5" />
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{formatPrice(crypto.price)}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold text-[9px] sm:text-[10px] ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                      </span>
                      <span className="text-[9px] text-slate-500">24h</span>
                    </div>
                    
                    {crypto.marketCap > 0 && (
                      <div className="pt-0.5 border-t border-slate-200 space-y-0">
                        <div className="flex justify-between text-[9px]">
                          <span className="text-slate-500">MCap:</span>
                          <span className="font-medium text-slate-700">{formatMarketCap(crypto.marketCap)}</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-slate-500">Vol:</span>
                          <span className="font-medium text-slate-700">{formatMarketCap(crypto.volume24h)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </section>

        {/* Top News Section */}
        <section className="mb-4 sm:mb-6">
          <button
            onClick={() => toggleSection('news')}
            className="flex items-center gap-1.5 mb-2 sm:mb-3 w-full text-left hover:opacity-80 transition-opacity"
          >
            <Newspaper className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Top News</h2>
            {collapsedSections.news ? (
              <ChevronRight className="h-4 w-4 text-slate-500 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500 ml-auto" />
            )}
          </button>
          
          {!collapsedSections.news && (
          <div className="space-y-2 sm:space-y-3">
            {news.length === 0 ? (
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 text-center">
                <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-slate-400" />
                <p className="text-xs sm:text-sm text-slate-600 mb-1 font-medium">News API integration needed</p>
                <p className="text-[10px] sm:text-xs text-slate-500">Add NEWS_API_KEY to environment variables. Get a free key from <a href="https://newsapi.org/" target="_blank" rel="noopener noreferrer" className="underline">newsapi.org</a></p>
              </div>
            ) : (
              news.map((article) => {
                const timeAgo = getTimeAgo(new Date(article.publishedAt).getTime() / 1000)
                
                return (
                  <a
                    key={article.url}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-all hover:border-slate-300"
                  >
                    <div className="flex gap-3">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{article.source}</span>
                          <span className="text-[10px] sm:text-xs text-slate-400">·</span>
                          <span className="text-[10px] sm:text-xs text-slate-400">{timeAgo}</span>
                        </div>
                        <h3 className="font-semibold text-xs sm:text-sm text-slate-900 mb-1.5 line-clamp-2">{article.title}</h3>
                        <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed line-clamp-2 mb-2">{article.description}</p>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                          <span>Read more</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })
            )}
          </div>
          )}
        </section>
      </main>
    </div>
  )
}
