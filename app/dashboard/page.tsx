'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Coins, BarChart3, Newspaper, ExternalLink, ChevronDown, ChevronRight, Sparkles, Trophy, Target } from 'lucide-react'

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

interface ATPResult {
  tournament: string
  round: string
  winner: string
  loser: string
  score: string
  date: string
  significance?: string
  url?: string
}

interface TennisProTip {
  teachingFocus: {
    focus: string
    tip: string
    reminder: string
  }
  dailyDrill: {
    name: string
    description: string
    focus: string
    level: string
    time: string
    equipment: string
  }
  date: string
}

export default function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [dailyThought, setDailyThought] = useState<string>('')
  const [atpResults, setAtpResults] = useState<ATPResult[]>([])
  const [tennisProTip, setTennisProTip] = useState<TennisProTip | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({})
  const [expandedStocks, setExpandedStocks] = useState<{ [key: string]: boolean }>({})

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch stocks, crypto, news, daily thought, ATP results, and tennis pro tip in parallel
      const [stocksRes, cryptosRes, newsRes, thoughtRes, atpRes, tennisTipRes] = await Promise.all([
        fetch('/api/markets/stocks'),
        fetch('/api/markets/crypto'),
        fetch('/api/markets/news'),
        fetch('/api/daily-thought'),
        fetch('/api/tennis/atp-results'),
        fetch('/api/tennis-pro-tip'),
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

      if (atpRes.ok) {
        const atpData = await atpRes.json()
        setAtpResults(atpData.results || [])
      } else {
        const errorData = await atpRes.json().catch(() => ({}))
        console.error('ATP Results API error:', errorData)
        // Set empty array so it shows the loading message, not an error
        setAtpResults([])
      }

      if (tennisTipRes.ok) {
        const tipData = await tennisTipRes.json()
        setTennisProTip(tipData)
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

  // Intraday chart component with detailed price action visualization
  const StockChart = ({ data, isPositive }: { data: IntradayDataPoint[], isPositive: boolean }) => {
    if (!data || data.length === 0) return null

    const width = 800
    const height = 300
    const padding = { top: 30, right: 60, bottom: 60, left: 70 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const prices = data.map(d => d.price).filter(p => p !== null && !isNaN(p))
    if (prices.length === 0) return null
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1
    const pricePadding = priceRange * 0.05 // 5% padding on top and bottom
    const adjustedMinPrice = minPrice - pricePadding
    const adjustedMaxPrice = maxPrice + pricePadding
    const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice

    // Determine trading periods (ET timezone)
    const getTradingPeriod = (timestamp: number) => {
      const date = new Date(timestamp * 1000)
      const hours = date.getHours()
      const minutes = date.getMinutes()
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
        const y = padding.top + chartHeight - ((point.price - adjustedMinPrice) / adjustedPriceRange) * chartHeight
        const period = getTradingPeriod(point.timestamp)
        return { x, y, point, period, index }
      })
      .filter(p => p !== null) as Array<{ x: number; y: number; point: IntradayDataPoint; period: string; index: number }>

    const linePoints = points.map(p => `${p.x},${p.y}`).join(' ')

    const areaPoints = [
      `${padding.left},${height - padding.bottom}`,
      ...points.map(p => `${p.x},${p.y}`),
      `${width - padding.right},${height - padding.bottom}`
    ].join(' ')

    // Find period boundaries for visual separation
    const preMarketEnd = points.findIndex(p => p.period === 'regular')
    const regularEnd = points.findIndex((p, idx) => idx > preMarketEnd && p.period === 'after')

    // Show time labels at key intervals
    const labelInterval = Math.max(1, Math.floor(data.length / 10))
    const timeLabels = data
      .map((point, index) => ({ point, index }))
      .filter((_, idx) => idx % labelInterval === 0 || idx === 0 || idx === data.length - 1)
      .slice(0, 12)

    // Calculate price levels for grid
    const numGridLines = 6
    const gridPrices = Array.from({ length: numGridLines }, (_, i) => {
      const ratio = i / (numGridLines - 1)
      return adjustedMinPrice + (ratio * adjustedPriceRange)
    })

    return (
      <div className="w-full overflow-x-auto bg-mcm-cream-50 rounded-mcm-lg border-2 border-mcm-charcoal-200 p-4 shadow-mcm">
        <svg width={width} height={height} className="min-w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`gradient-${isPositive ? 'olive' : 'orange'}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPositive ? 'rgba(107, 126, 70, 0.3)' : 'rgba(201, 125, 96, 0.3)'} />
              <stop offset="100%" stopColor={isPositive ? 'rgba(107, 126, 70, 0)' : 'rgba(201, 125, 96, 0)'} />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1"/>
            </filter>
          </defs>
          
          {/* Period background zones */}
          {preMarketEnd > 0 && (
            <rect
              x={padding.left}
              y={padding.top}
              width={(preMarketEnd / (data.length - 1 || 1)) * chartWidth}
              height={chartHeight}
              fill="rgba(74, 124, 126, 0.1)"
            />
          )}
          {regularEnd > preMarketEnd && (
            <rect
              x={padding.left + (preMarketEnd / (data.length - 1 || 1)) * chartWidth}
              y={padding.top}
              width={((regularEnd - preMarketEnd) / (data.length - 1 || 1)) * chartWidth}
              height={chartHeight}
              fill="rgba(107, 126, 70, 0.1)"
            />
          )}
          {regularEnd > 0 && regularEnd < data.length - 1 && (
            <rect
              x={padding.left + (regularEnd / (data.length - 1 || 1)) * chartWidth}
              y={padding.top}
              width={((data.length - 1 - regularEnd) / (data.length - 1 || 1)) * chartWidth}
              height={chartHeight}
              fill="rgba(74, 124, 126, 0.1)"
            />
          )}
          
          {/* Horizontal grid lines with price labels */}
          {gridPrices.map((price, idx) => {
            const y = padding.top + chartHeight - ((price - adjustedMinPrice) / adjustedPriceRange) * chartHeight
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={idx === Math.floor(numGridLines / 2) ? "#A0826D" : "#DBC9AE"}
                  strokeWidth={idx === Math.floor(numGridLines / 2) ? "1.5" : "1"}
                  strokeDasharray={idx === Math.floor(numGridLines / 2) ? "0" : "3,3"}
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#2C3E50"
                  fontWeight={idx === Math.floor(numGridLines / 2) ? "600" : "400"}
                >
                  {formatPrice(price)}
                </text>
              </g>
            )
          })}
          
          {/* Area fill under the line */}
          <polygon
            points={areaPoints}
            fill={`url(#gradient-${isPositive ? 'olive' : 'orange'})`}
            opacity="0.5"
          />
          
          {/* Main price line - thicker and more prominent */}
          <polyline
            points={linePoints}
            fill="none"
            stroke={isPositive ? '#6B7E46' : '#C97D60'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#shadow)"
          />
          
          {/* Data points as small circles for better visibility */}
          {points.filter((_, idx) => idx % Math.max(1, Math.floor(points.length / 50)) === 0).map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill={isPositive ? '#6B7E46' : '#C97D60'}
              stroke="#F5EEDE"
              strokeWidth="1.5"
            />
          ))}
          
          {/* Period dividers */}
          {preMarketEnd > 0 && (
            <line
              x1={padding.left + (preMarketEnd / (data.length - 1 || 1)) * chartWidth}
              y1={padding.top - 5}
              x2={padding.left + (preMarketEnd / (data.length - 1 || 1)) * chartWidth}
              y2={height - padding.bottom + 5}
              stroke="#4A7C7E"
              strokeWidth="2"
              strokeDasharray="5,3"
              opacity="0.7"
            />
          )}
          {regularEnd > preMarketEnd && (
            <line
              x1={padding.left + (regularEnd / (data.length - 1 || 1)) * chartWidth}
              y1={padding.top - 5}
              x2={padding.left + (regularEnd / (data.length - 1 || 1)) * chartWidth}
              y2={height - padding.bottom + 5}
              stroke="#4A7C7E"
              strokeWidth="2"
              strokeDasharray="5,3"
              opacity="0.7"
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
                    y2={height - padding.bottom + 8}
                    stroke="#8B6F47"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 22}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#2C3E50"
                    fontWeight="500"
                  >
                    {formatTime(point.timestamp)}
                  </text>
              </g>
            )
          })}
          
          {/* Period labels at top */}
          {preMarketEnd > 0 && (
            <text
              x={padding.left + (preMarketEnd / (data.length - 1 || 1)) * chartWidth / 2}
              y={padding.top - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#4A7C7E"
              fontWeight="600"
            >
              Pre-Market
            </text>
          )}
          {regularEnd > preMarketEnd && (
            <text
              x={padding.left + (preMarketEnd / (data.length - 1 || 1)) * chartWidth + ((regularEnd - preMarketEnd) / (data.length - 1 || 1)) * chartWidth / 2}
              y={padding.top - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#6B7E46"
              fontWeight="600"
            >
              Regular Hours
            </text>
          )}
          {regularEnd > 0 && regularEnd < data.length - 1 && (
            <text
              x={padding.left + (regularEnd / (data.length - 1 || 1)) * chartWidth + ((data.length - 1 - regularEnd) / (data.length - 1 || 1)) * chartWidth / 2}
              y={padding.top - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#4A7C7E"
              fontWeight="600"
            >
              After-Hours
            </text>
          )}
          
          {/* Current price indicator line */}
          {points.length > 0 && (
            <>
              <line
                x1={points[points.length - 1].x}
                y1={padding.top - 5}
                x2={points[points.length - 1].x}
                y2={height - padding.bottom + 5}
                stroke={isPositive ? '#6B7E46' : '#C97D60'}
                strokeWidth="1.5"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="5"
                fill={isPositive ? '#6B7E46' : '#C97D60'}
                stroke="#F5EEDE"
                strokeWidth="2"
              />
              <text
                x={points[points.length - 1].x}
                y={points[points.length - 1].y - 12}
                textAnchor="middle"
                fontSize="11"
                fill={isPositive ? '#6B7E46' : '#C97D60'}
                fontWeight="700"
              >
                {formatPrice(points[points.length - 1].point.price)}
              </text>
            </>
          )}
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-mcm-cream-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-mcm-charcoal-500" />
          <p className="text-mcm-charcoal-600 font-display">Loading market data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mcm-cream-50" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(212, 165, 116, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(74, 124, 126, 0.03) 0%, transparent 50%)' }}>
      {/* Header */}
      <header className="bg-mcm-cream-100/80 backdrop-blur-sm border-b-2 border-mcm-charcoal-200 sticky top-0 z-40 shadow-mcm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-mcm-charcoal-700 tracking-tight">Dashboard</h1>
              {lastUpdated && (
                <p className="text-xs text-mcm-charcoal-500 font-display mt-1">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-mcm-mustard-500 text-mcm-charcoal-800 rounded-mcm hover:bg-mcm-mustard-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-display font-medium shadow-mcm hover:shadow-mcm-lg"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stocks Section */}
        <section className="mb-5 sm:mb-6">
          <button
            onClick={() => toggleSection('stocks')}
            className="flex items-center gap-2 mb-3 w-full text-left hover:opacity-80 transition-opacity group"
          >
            <div className="p-1.5 bg-mcm-teal-500 rounded-mcm">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-display font-semibold text-mcm-charcoal-700">Stocks</h2>
            {collapsedSections.stocks ? (
              <ChevronRight className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            )}
          </button>
          
          {!collapsedSections.stocks && (
          <div className="bg-mcm-cream-100 rounded-mcm-lg shadow-mcm-lg border-2 border-mcm-charcoal-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-mcm-teal-500 border-b-2 border-mcm-charcoal-300">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-display font-semibold text-white uppercase tracking-wider">Symbol</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-display font-semibold text-white uppercase tracking-wider hidden sm:table-cell">Name</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-right text-[10px] sm:text-xs font-display font-semibold text-white uppercase tracking-wider">Price</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-right text-[10px] sm:text-xs font-display font-semibold text-white uppercase tracking-wider">Change</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-right text-[10px] sm:text-xs font-display font-semibold text-white uppercase tracking-wider hidden md:table-cell">Volume</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-display font-semibold text-white uppercase tracking-wider hidden lg:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mcm-charcoal-200">
                  {stocks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 sm:px-4 py-4 sm:py-6 text-center text-mcm-charcoal-500">
                        <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mx-auto mb-2 text-mcm-charcoal-400" />
                        <p className="text-xs sm:text-sm font-display text-mcm-charcoal-600">Loading stock data...</p>
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
                          className="hover:bg-mcm-cream-200/50 transition-colors cursor-pointer bg-mcm-cream-50"
                          onClick={() => toggleStock(stock.symbol)}
                        >
                          <td className="px-3 sm:px-4 py-2 sm:py-2.5">
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-mcm-teal-600" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-mcm-teal-600" />
                              )}
                              <span className="font-mono font-bold text-mcm-charcoal-700 text-xs sm:text-sm">{stock.symbol}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-2.5 hidden sm:table-cell">
                            <span className="text-mcm-charcoal-600 text-xs sm:text-sm truncate max-w-[120px] font-display">{stock.name}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right">
                            <span className="font-display font-semibold text-mcm-charcoal-800 text-xs sm:text-sm">{formatPrice(stock.price)}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                              {isPositive ? (
                                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-mcm-olive-600" />
                              ) : (
                                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-mcm-orange-600" />
                              )}
                              <span className={`font-display font-semibold text-xs sm:text-sm ${isPositive ? 'text-mcm-olive-700' : 'text-mcm-orange-700'}`}>
                                {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </span>
                              <span className={`text-[10px] sm:text-xs hidden sm:inline font-display ${isPositive ? 'text-mcm-olive-600' : 'text-mcm-orange-600'}`}>
                                ({isPositive ? '+' : ''}{formatPrice(stock.change)})
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right hidden md:table-cell">
                            <span className="text-mcm-charcoal-600 text-xs font-display">{formatVolume(stock.volume)}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-2.5 hidden lg:table-cell">
                            <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-mcm text-[10px] sm:text-xs font-display font-medium ${
                              isMarketOpen 
                                ? 'bg-mcm-olive-100 text-mcm-olive-800 border border-mcm-olive-300' 
                                : 'bg-mcm-charcoal-100 text-mcm-charcoal-700 border border-mcm-charcoal-300'
                            }`}>
                              {isMarketOpen ? 'Open' : 'Closed'}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${stock.symbol}-chart`} className="bg-mcm-cream-100">
                            <td colSpan={6} className="px-3 sm:px-4 py-4 sm:py-6">
                              {stock.intradayData && stock.intradayData.length > 0 ? (
                                <div className="space-y-4">
                                  {/* Chart */}
                                  <div>
                                    <p className="text-sm font-display font-semibold text-mcm-charcoal-700 mb-2">Last Trading Day - Intraday Movement (Pre-Market, Regular Hours & After-Hours)</p>
                                    <div className="bg-mcm-cream-50 rounded-mcm-lg p-3 border-2 border-mcm-charcoal-200">
                                      <StockChart data={stock.intradayData} isPositive={isPositive} />
                                    </div>
                                  </div>
                                  
                                  {/* Detailed Stats */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    <div className="bg-mcm-cream-50 rounded-mcm p-3 border-2 border-mcm-teal-300 shadow-mcm">
                                      <p className="text-xs text-mcm-charcoal-500 mb-1 font-display">Day High</p>
                                      <p className="text-base font-display font-bold text-mcm-charcoal-800">
                                        {formatPrice(Math.max(...stock.intradayData.map(d => d.high || d.price).filter(p => p !== null && !isNaN(p))))}
                                      </p>
                                    </div>
                                    <div className="bg-mcm-cream-50 rounded-mcm p-3 border-2 border-mcm-orange-300 shadow-mcm">
                                      <p className="text-xs text-mcm-charcoal-500 mb-1 font-display">Day Low</p>
                                      <p className="text-base font-display font-bold text-mcm-charcoal-800">
                                        {formatPrice(Math.min(...stock.intradayData.map(d => d.low || d.price).filter(p => p !== null && !isNaN(p))))}
                                      </p>
                                    </div>
                                    <div className="bg-mcm-cream-50 rounded-mcm p-3 border-2 border-mcm-mustard-300 shadow-mcm">
                                      <p className="text-xs text-mcm-charcoal-500 mb-1 font-display">Open</p>
                                      <p className="text-base font-display font-bold text-mcm-charcoal-800">
                                        {stock.intradayData.length > 0 ? formatPrice(stock.intradayData[0].price) : 'N/A'}
                                      </p>
                                    </div>
                                    <div className={`bg-mcm-cream-50 rounded-mcm p-3 border-2 shadow-mcm ${isPositive ? 'border-mcm-olive-300' : 'border-mcm-orange-300'}`}>
                                      <p className="text-xs text-mcm-charcoal-500 mb-1 font-display">Current</p>
                                      <p className={`text-base font-display font-bold ${isPositive ? 'text-mcm-olive-700' : 'text-mcm-orange-700'}`}>
                                        {formatPrice(stock.price)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Additional Info */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-display">
                                    <div>
                                      <span className="text-mcm-charcoal-500">Range: </span>
                                      <span className="font-semibold text-mcm-charcoal-700">
                                        {formatPrice(Math.max(...stock.intradayData.map(d => d.high || d.price).filter(p => p !== null && !isNaN(p))) - 
                                          Math.min(...stock.intradayData.map(d => d.low || d.price).filter(p => p !== null && !isNaN(p))))}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-mcm-charcoal-500">Volume: </span>
                                      <span className="font-semibold text-mcm-charcoal-700">{formatVolume(stock.volume)}</span>
                                    </div>
                                    <div>
                                      <span className="text-mcm-charcoal-500">Change: </span>
                                      <span className={`font-semibold ${isPositive ? 'text-mcm-olive-700' : 'text-mcm-orange-700'}`}>
                                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}% ({isPositive ? '+' : ''}{formatPrice(stock.change)})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-mcm-cream-50 rounded-mcm-lg p-4 border-2 border-mcm-charcoal-200 text-center shadow-mcm">
                                  <p className="text-sm text-mcm-charcoal-600 mb-2 font-display">Intraday data not available</p>
                                  <p className="text-xs text-mcm-charcoal-500 font-display">
                                    {stock.marketState === 'REGULAR' 
                                      ? 'Data is loading or market is currently open. Please refresh.' 
                                      : 'Market is closed. Intraday data will be available during trading hours.'}
                                  </p>
                                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-display">
                                    <div>
                                      <span className="text-mcm-charcoal-500">Current Price: </span>
                                      <span className="font-semibold text-mcm-charcoal-700">{formatPrice(stock.price)}</span>
                                    </div>
                                    <div>
                                      <span className="text-mcm-charcoal-500">Previous Close: </span>
                                      <span className="font-semibold text-mcm-charcoal-700">{formatPrice(stock.previousClose)}</span>
                                    </div>
                                    <div>
                                      <span className="text-mcm-charcoal-500">Change: </span>
                                      <span className={`font-semibold ${isPositive ? 'text-mcm-olive-700' : 'text-mcm-orange-700'}`}>
                                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-mcm-charcoal-500">Volume: </span>
                                      <span className="font-semibold text-mcm-charcoal-700">{formatVolume(stock.volume)}</span>
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
        <section className="mb-5 sm:mb-6">
          <button
            onClick={() => toggleSection('crypto')}
            className="flex items-center gap-2 mb-3 w-full text-left hover:opacity-80 transition-opacity group"
          >
            <div className="p-1.5 bg-mcm-mustard-500 rounded-mcm">
              <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-display font-semibold text-mcm-charcoal-700">Cryptocurrency</h2>
            {collapsedSections.crypto ? (
              <ChevronRight className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            )}
          </button>
          
          {!collapsedSections.crypto && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {cryptos.map((crypto) => {
              const isPositive = crypto.change24h >= 0
              
              return (
                <div
                  key={crypto.id}
                  className="bg-mcm-cream-100 rounded-mcm-lg shadow-mcm border-2 border-mcm-charcoal-200 p-3 hover:shadow-mcm-lg hover:border-mcm-teal-400 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-semibold text-mcm-charcoal-800 text-xs sm:text-sm truncate">{crypto.name}</h3>
                        <p className="text-[10px] sm:text-xs text-mcm-charcoal-500 font-mono flex-shrink-0">{crypto.symbol}</p>
                      </div>
                    </div>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-mcm-olive-600 flex-shrink-0 ml-0.5" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-mcm-orange-600 flex-shrink-0 ml-0.5" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div>
                      <p className="text-sm sm:text-base font-display font-bold text-mcm-charcoal-800">{formatPrice(crypto.price)}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className={`font-display font-semibold text-[10px] sm:text-xs ${isPositive ? 'text-mcm-olive-700' : 'text-mcm-orange-700'}`}>
                        {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-mcm-charcoal-500 font-display">24h</span>
                    </div>
                    
                    {crypto.marketCap > 0 && (
                      <div className="pt-1.5 border-t-2 border-mcm-charcoal-200 space-y-1">
                        <div className="flex justify-between text-[10px] sm:text-xs font-display">
                          <span className="text-mcm-charcoal-500">MCap:</span>
                          <span className="font-medium text-mcm-charcoal-700">{formatMarketCap(crypto.marketCap)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] sm:text-xs font-display">
                          <span className="text-mcm-charcoal-500">Vol:</span>
                          <span className="font-medium text-mcm-charcoal-700">{formatMarketCap(crypto.volume24h)}</span>
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
        <section className="mb-5 sm:mb-6">
          <button
            onClick={() => toggleSection('thought')}
            className="flex items-center gap-2 mb-3 w-full text-left hover:opacity-80 transition-opacity group"
          >
            <div className="p-1.5 bg-mcm-orange-500 rounded-mcm">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-display font-semibold text-mcm-charcoal-700">Daily Thought</h2>
            {collapsedSections.thought ? (
              <ChevronRight className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            )}
          </button>
          
          {!collapsedSections.thought && (
            <div className="bg-gradient-to-br from-mcm-mustard-100 via-mcm-cream-200 to-mcm-orange-100 rounded-mcm-lg shadow-mcm-lg border-2 border-mcm-orange-300 p-4 sm:p-6">
              {dailyThought ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-mcm-orange-700 flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-mcm-charcoal-800 leading-relaxed italic font-display font-light">
                      "{dailyThought}"
                    </p>
                  </div>
                  <div className="pt-3 border-t-2 border-mcm-orange-300">
                    <p className="text-[10px] sm:text-xs text-mcm-orange-700 font-display font-medium">A moment of reflection for today</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-mcm-orange-500" />
                  <p className="text-xs sm:text-sm text-mcm-orange-700 font-display">Loading today's thought...</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ATP Tennis Results Section */}
        <section className="mb-5 sm:mb-6">
          <button
            onClick={() => toggleSection('atp')}
            className="flex items-center gap-2 mb-3 w-full text-left hover:opacity-80 transition-opacity group"
          >
            <div className="p-1.5 bg-mcm-teal-500 rounded-mcm">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-display font-semibold text-mcm-charcoal-700">ATP Tennis Results</h2>
            {collapsedSections.atp ? (
              <ChevronRight className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            )}
          </button>
          
          {!collapsedSections.atp && (
            <div className="space-y-3 sm:space-y-4">
              {atpResults.length === 0 ? (
                <div className="bg-mcm-cream-100 rounded-mcm-lg shadow-mcm border-2 border-mcm-charcoal-200 p-4 sm:p-5 text-center">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-mcm-charcoal-400" />
                  <p className="text-xs sm:text-sm text-mcm-charcoal-600 mb-1 font-display font-medium">Loading ATP results...</p>
                  <p className="text-[10px] sm:text-xs text-mcm-charcoal-500 font-display">Recent tournament results will appear here</p>
                </div>
              ) : (
                atpResults.map((result, index) => {
                  const resultDate = new Date(result.date)
                  const dateStr = resultDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  
                  return (
                    <div
                      key={index}
                      className="bg-mcm-cream-100 rounded-mcm-lg shadow-mcm border-2 border-mcm-charcoal-200 p-4 sm:p-5 hover:shadow-mcm-lg hover:border-mcm-teal-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Trophy className="h-4 w-4 text-mcm-teal-600 flex-shrink-0" />
                            <h3 className="font-display font-semibold text-xs sm:text-sm text-mcm-charcoal-800 truncate">
                              {result.tournament}
                            </h3>
                          </div>
                          <p className="text-[10px] sm:text-xs text-mcm-charcoal-500 font-display mb-2">
                            {result.round} • {dateStr}
                          </p>
                        </div>
                        {result.significance && (
                          <span className="px-2 py-1 bg-mcm-mustard-200 text-mcm-charcoal-700 rounded-mcm text-[10px] font-display font-medium flex-shrink-0">
                            {result.significance}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b border-mcm-charcoal-200">
                          <div className="flex-1">
                            <p className="font-display font-semibold text-xs sm:text-sm text-mcm-olive-700">
                              {result.winner}
                            </p>
                            <p className="text-[10px] sm:text-xs text-mcm-charcoal-500 font-display">Winner</p>
                          </div>
                          <div className="text-center px-3">
                            <p className="font-display font-bold text-sm sm:text-base text-mcm-charcoal-800">
                              {result.score}
                            </p>
                          </div>
                          <div className="flex-1 text-right">
                            <p className="font-display font-medium text-xs sm:text-sm text-mcm-charcoal-600">
                              {result.loser}
                            </p>
                            <p className="text-[10px] sm:text-xs text-mcm-charcoal-500 font-display">Runner-up</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </section>

        {/* Top News Section - Always at the bottom */}
        <section className="mb-5 sm:mb-6">
          <button
            onClick={() => toggleSection('news')}
            className="flex items-center gap-2 mb-3 w-full text-left hover:opacity-80 transition-opacity group"
          >
            <div className="p-1.5 bg-mcm-olive-500 rounded-mcm">
              <Newspaper className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-display font-semibold text-mcm-charcoal-700">Top News</h2>
            {collapsedSections.news ? (
              <ChevronRight className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-mcm-charcoal-400 ml-auto group-hover:text-mcm-charcoal-600" />
            )}
          </button>
          
          {!collapsedSections.news && (
          <div className="space-y-3 sm:space-y-4">
            {news.length === 0 ? (
              <div className="bg-mcm-cream-100 rounded-mcm-lg shadow-mcm border-2 border-mcm-charcoal-200 p-4 sm:p-5 text-center">
                <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-mcm-charcoal-400" />
                <p className="text-xs sm:text-sm text-mcm-charcoal-600 mb-1 font-display font-medium">News API integration needed</p>
                <p className="text-[10px] sm:text-xs text-mcm-charcoal-500 font-display">Add NEWS_API_KEY to environment variables. Get a free key from <a href="https://newsapi.org/" target="_blank" rel="noopener noreferrer" className="underline text-mcm-teal-600 hover:text-mcm-teal-700">newsapi.org</a></p>
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
                    className="block bg-mcm-cream-100 rounded-mcm-lg shadow-mcm border-2 border-mcm-charcoal-200 p-4 sm:p-5 hover:shadow-mcm-lg hover:border-mcm-olive-400 transition-all"
                  >
                    <div className="flex gap-3">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-mcm object-cover flex-shrink-0 border-2 border-mcm-charcoal-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
                          <span className="text-[10px] sm:text-xs text-mcm-charcoal-500 font-display font-medium">{article.source}</span>
                          <span className="text-[10px] sm:text-xs text-mcm-charcoal-400">·</span>
                          <span className="text-[10px] sm:text-xs text-mcm-charcoal-400 font-display">{timeAgo}</span>
                        </div>
                        <h3 className="font-display font-semibold text-xs sm:text-sm text-mcm-charcoal-800 mb-2 line-clamp-2">{article.title}</h3>
                        <p className="text-[10px] sm:text-xs text-mcm-charcoal-600 leading-relaxed line-clamp-2 mb-2.5 font-display">{article.description}</p>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-mcm-teal-600 font-display font-medium">
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
