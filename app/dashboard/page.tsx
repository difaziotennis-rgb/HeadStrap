'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Coins, BarChart3, Newspaper, ExternalLink, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'

interface IntradayDataPoint {
  timestamp: number
  price: number
  volume: number
  high?: number
  low?: number
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
  intradayData?: IntradayDataPoint[]
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
  const [dailyThought, setDailyThought] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({})
  const [expandedStocks, setExpandedStocks] = useState<{ [key: string]: boolean }>({})

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch stocks, crypto, news, and daily thought in parallel
      const [stocksRes, cryptosRes, newsRes, thoughtRes] = await Promise.all([
        fetch('/api/markets/stocks'),
        fetch('/api/markets/crypto'),
        fetch('/api/markets/news'),
        fetch('/api/daily-thought'),
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

      if (thoughtRes.ok) {
        const thoughtData = await thoughtRes.json()
        setDailyThought(thoughtData.thought || '')
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

  // Intraday chart component with pre-market and after-hours
  const StockChart = ({ data, isPositive }: { data: IntradayDataPoint[], isPositive: boolean }) => {
    if (!data || data.length === 0) return null

    const width = 700
    const height = 220
    const padding = { top: 25, right: 50, bottom: 50, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const prices = data.map(d => d.price).filter(p => p !== null && !isNaN(p))
    if (prices.length === 0) return null
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    // Determine trading periods (ET timezone)
    const getTradingPeriod = (timestamp: number) => {
      const date = new Date(timestamp * 1000)
      // Convert to ET (approximate, for display purposes)
      const hours = date.getUTCHours() - 5 // EST offset
      const minutes = date.getUTCMinutes()
      const totalMinutes = hours * 60 + minutes
      
      // Pre-market: 4:00 AM - 9:30 AM ET
      if (totalMinutes >= 240 && totalMinutes < 570) return 'pre'
      // Regular hours: 9:30 AM - 4:00 PM ET
      if (totalMinutes >= 570 && totalMinutes < 960) return 'regular'
      // After-hours: 4:00 PM - 8:00 PM ET
      if (totalMinutes >= 960 && totalMinutes < 1200) return 'after'
      return 'other'
    }

    // Format time for labels
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp * 1000)
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      if (minutes === 0) return `${displayHours}${ampm}`
      return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`
    }

    // Calculate points for the line with period info
    const points = data
      .map((point, index) => {
        if (point.price === null || isNaN(point.price)) return null
        const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth
        const y = padding.top + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight
        const period = getTradingPeriod(point.timestamp)
        return { x, y, point, period }
      })
      .filter(p => p !== null) as Array<{ x: number; y: number; point: IntradayDataPoint; period: string }>

    const linePoints = points.map(p => `${p.x},${p.y}`).join(' ')

    const areaPoints = [
      `${padding.left},${height - padding.bottom}`,
      ...points.map(p => `${p.x},${p.y}`),
      `${width - padding.right},${height - padding.bottom}`
    ].join(' ')

    // Find period boundaries for visual separation
    const preMarketEnd = points.findIndex(p => p.period === 'regular')
    const regularEnd = points.findIndex((p, idx) => idx > preMarketEnd && p.period === 'after')

    // Show time labels (every 2-3 hours or key times)
    const keyTimes = ['4:00 AM', '9:30 AM', '12:00 PM', '4:00 PM', '8:00 PM']
    const timeLabels = data
      .map((point, index) => {
        const timeStr = formatTime(point.timestamp)
        const isKeyTime = keyTimes.some(kt => timeStr.includes(kt.split(' ')[0]))
        return { point, index, timeStr, isKeyTime }
      })
      .filter((item, idx, arr) => {
        // Show first, last, and key times, plus every Nth point
        const labelInterval = Math.max(1, Math.floor(data.length / 8))
        return idx === 0 || idx === data.length - 1 || item.isKeyTime || idx % labelInterval === 0
      })
      .slice(0, 10) // Limit to 10 labels max

    return (
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="min-w-full" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id={`gradient-${isPositive ? 'green' : 'red'}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'} />
              <stop offset="100%" stopColor={isPositive ? 'rgba(34, 197, 94, 0)' : 'rgba(239, 68, 68, 0)'} />
            </linearGradient>
          </defs>
          
          {/* Period background zones */}
          {preMarketEnd > 0 && (
            <rect
              x={padding.left}
              y={padding.top}
              width={(preMarketEnd / (data.length - 1 || 1)) * chartWidth}
              height={chartHeight}
              fill="rgba(99, 102, 241, 0.05)"
            />
          )}
          {regularEnd > preMarketEnd && (
            <rect
              x={padding.left + (preMarketEnd / (data.length - 1 || 1)) * chartWidth}
              y={padding.top}
              width={((regularEnd - preMarketEnd) / (data.length - 1 || 1)) * chartWidth}
              height={chartHeight}
              fill="rgba(34, 197, 94, 0.05)"
            />
          )}
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight - (ratio * chartHeight)
            const price = minPrice + (ratio * priceRange)
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748b"
                >
                  {formatPrice(price)}
                </text>
              </g>
            )
          })}
          
          {/* Area fill */}
          <polygon
            points={areaPoints}
            fill={`url(#gradient-${isPositive ? 'green' : 'red'})`}
          />
          
          {/* Price line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Period dividers */}
          {preMarketEnd > 0 && (
            <line
              x1={padding.left + (preMarketEnd / (data.length - 1 || 1)) * chartWidth}
              y1={padding.top}
              x2={padding.left + (preMarketEnd / (data.length - 1 || 1)) * chartWidth}
              y2={height - padding.bottom}
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeDasharray="4,2"
              opacity="0.6"
            />
          )}
          {regularEnd > preMarketEnd && (
            <line
              x1={padding.left + (regularEnd / (data.length - 1 || 1)) * chartWidth}
              y1={padding.top}
              x2={padding.left + (regularEnd / (data.length - 1 || 1)) * chartWidth}
              y2={height - padding.bottom}
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeDasharray="4,2"
              opacity="0.6"
            />
          )}
          
          {/* Time labels on x-axis */}
          {timeLabels.map(({ point, index }) => {
            const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth
            return (
              <g key={index}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 5}
                  stroke="#64748b"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  {formatTime(point.timestamp)}
                </text>
              </g>
            )
          })}
          
          {/* Period labels */}
          <text
            x={padding.left + 10}
            y={padding.top + 15}
            fontSize="10"
            fill="#6366f1"
            fontWeight="500"
          >
            Pre-Market
          </text>
          {regularEnd > preMarketEnd && (
            <text
              x={padding.left + (preMarketEnd / (data.length - 1 || 1)) * chartWidth + 10}
              y={padding.top + 15}
              fontSize="10"
              fill="#22c55e"
              fontWeight="500"
            >
              Regular Hours
            </text>
          )}
          {regularEnd > 0 && regularEnd < data.length - 1 && (
            <text
              x={padding.left + (regularEnd / (data.length - 1 || 1)) * chartWidth + 10}
              y={padding.top + 15}
              fontSize="10"
              fill="#6366f1"
              fontWeight="500"
            >
              After-Hours
            </text>
          )}
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
                        {isExpanded && (
                          <tr key={`${stock.symbol}-chart`} className="bg-slate-50">
                            <td colSpan={6} className="px-2 sm:px-3 py-4 sm:py-6">
                              {stock.intradayData && stock.intradayData.length > 0 ? (
                                <div className="space-y-4">
                                  {/* Chart */}
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 mb-2">Last Trading Day - Intraday Movement (Pre-Market, Regular Hours & After-Hours)</p>
                                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                                      <StockChart data={stock.intradayData} isPositive={isPositive} />
                                    </div>
                                  </div>
                                  
                                  {/* Detailed Stats */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Day High</p>
                                      <p className="text-base font-bold text-slate-900">
                                        {formatPrice(Math.max(...stock.intradayData.map(d => d.high || d.price).filter(p => p !== null && !isNaN(p))))}
                                      </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Day Low</p>
                                      <p className="text-base font-bold text-slate-900">
                                        {formatPrice(Math.min(...stock.intradayData.map(d => d.low || d.price).filter(p => p !== null && !isNaN(p))))}
                                      </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Open</p>
                                      <p className="text-base font-bold text-slate-900">
                                        {stock.intradayData.length > 0 ? formatPrice(stock.intradayData[0].price) : 'N/A'}
                                      </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Current</p>
                                      <p className={`text-base font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPrice(stock.price)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Additional Info */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                    <div>
                                      <span className="text-slate-500">Range: </span>
                                      <span className="font-semibold text-slate-700">
                                        {formatPrice(Math.max(...stock.intradayData.map(d => d.high || d.price).filter(p => p !== null && !isNaN(p))) - 
                                          Math.min(...stock.intradayData.map(d => d.low || d.price).filter(p => p !== null && !isNaN(p))))}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Volume: </span>
                                      <span className="font-semibold text-slate-700">{formatVolume(stock.volume)}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Change: </span>
                                      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}% ({isPositive ? '+' : ''}{formatPrice(stock.change)})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
                                  <p className="text-sm text-slate-600 mb-2">Intraday data not available</p>
                                  <p className="text-xs text-slate-500">
                                    {stock.marketState === 'REGULAR' 
                                      ? 'Data is loading or market is currently open. Please refresh.' 
                                      : 'Market is closed. Intraday data will be available during trading hours.'}
                                  </p>
                                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                      <span className="text-slate-500">Current Price: </span>
                                      <span className="font-semibold text-slate-700">{formatPrice(stock.price)}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Previous Close: </span>
                                      <span className="font-semibold text-slate-700">{formatPrice(stock.previousClose)}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Change: </span>
                                      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Volume: </span>
                                      <span className="font-semibold text-slate-700">{formatVolume(stock.volume)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
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
                        <h3 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{crypto.name}</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-mono flex-shrink-0">{crypto.symbol}</p>
                      </div>
                    </div>
                    {isPositive ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-600 flex-shrink-0 ml-0.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-600 flex-shrink-0 ml-0.5" />
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    <div>
                      <p className="text-sm sm:text-base font-bold text-slate-900">{formatPrice(crypto.price)}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold text-[10px] sm:text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-500">24h</span>
                    </div>
                    
                    {crypto.marketCap > 0 && (
                      <div className="pt-0.5 border-t border-slate-200 space-y-0">
                        <div className="flex justify-between text-[10px] sm:text-xs">
                          <span className="text-slate-500">MCap:</span>
                          <span className="font-medium text-slate-700">{formatMarketCap(crypto.marketCap)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] sm:text-xs">
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

        {/* Daily Thought Section */}
        <section className="mb-4 sm:mb-6">
          <button
            onClick={() => toggleSection('thought')}
            className="flex items-center gap-1.5 mb-2 sm:mb-3 w-full text-left hover:opacity-80 transition-opacity"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Daily Thought</h2>
            {collapsedSections.thought ? (
              <ChevronRight className="h-4 w-4 text-slate-500 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500 ml-auto" />
            )}
          </button>
          
          {!collapsedSections.thought && (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg sm:rounded-xl shadow-sm border border-indigo-100 p-4 sm:p-5">
              {dailyThought ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-slate-800 leading-relaxed italic font-light">
                      "{dailyThought}"
                    </p>
                  </div>
                  <div className="pt-2 border-t border-indigo-200">
                    <p className="text-[10px] sm:text-xs text-indigo-600 font-medium">A moment of reflection for today</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-indigo-400" />
                  <p className="text-xs sm:text-sm text-indigo-600">Loading today's thought...</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
