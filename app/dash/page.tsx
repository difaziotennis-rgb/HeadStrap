'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { expectedMove } from '@/lib/markets/indicators'
import { THEME_GROUPS, type WatchTheme } from '@/lib/markets/watchlist'

type Point = { timestamp: number; price: number; volume?: number; high?: number | null; low?: number | null }

type Swing = {
  sma20: number | null
  sma50: number | null
  sma200: number | null
  rsi14: number | null
  atr14: number | null
  atrPct: number | null
  ret5d: number | null
  ret21d: number | null
  ret63d: number | null
  dist52wHighPct: number | null
  volVsAvg20: number | null
  aboveSma20: boolean | null
  aboveSma50: boolean | null
  aboveSma200: boolean | null
  trend: 'bullish' | 'bearish' | 'mixed' | 'unknown'
}

type SessionPrint = {
  price: number
  change: number
  changePercent: number
  asOf: number
}

type Stock = {
  symbol: string
  name: string
  theme: WatchTheme
  price: number
  previousClose: number
  change: number
  changePercent: number
  dayHigh: number | null
  dayLow: number | null
  currency: string
  marketState: string
  preMarket: SessionPrint | null
  postMarket: SessionPrint | null
  intradayData: Point[]
  dailyData: Point[]
  swing: Swing
  rs21vsQqq: number | null
}

type NewsArticle = {
  title: string
  url: string
  source: string
  publishedAt: string
  related?: string
}

type Tweet = {
  id: string
  text: string
  authorHandle: string
  timestamp: number
  likes?: number
  url: string
}

type Earnings = {
  date: string
  symbol: string
  time: string
  epsForecast: string | null
  daysUntil: number
}

type MacroEvent = {
  date: string
  title: string
  note: string
  daysUntil: number
}

type Interview = {
  id: string
  title: string
  channel: string
  publishedLabel: string
  url: string
  thumbnail: string
  related: string[]
}

type Tab = 'interviews' | 'catalysts' | 'news' | 'social' | 'playbook'
type Timeframe = '1D' | '3M'

function money(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function pct(n: number | null | undefined, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}%`
}

function num(n: number | null | undefined, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toFixed(digits)
}

function tone(n: number | null | undefined) {
  if (n == null) return 'text-zinc-400'
  if (n > 0.05) return 'text-emerald-400'
  if (n < -0.05) return 'text-red-400'
  return 'text-zinc-300'
}

function relativeTime(isoOrSec: string | number) {
  const ms = typeof isoOrSec === 'number' ? isoOrSec * 1000 : new Date(isoOrSec).getTime()
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000))
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 36) return `${hrs}h`
  return `${Math.round(hrs / 24)}d`
}

function chartLabel(ts: number, timeframe: Timeframe) {
  const d = new Date(ts * 1000)
  if (timeframe === '1D') {
    return d.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Sparkline({ points, up }: { points: Point[]; up: boolean }) {
  if (!points?.length) return <span className="text-zinc-600">—</span>
  const width = 96
  const height = 30
  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const coords = prices
    .map((price, i) => {
      const x = (i / Math.max(prices.length - 1, 1)) * width
      const y = height - ((price - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline fill="none" stroke={up ? '#34d399' : '#f87171'} strokeWidth="1.6" points={coords} />
    </svg>
  )
}

function PriceChart({ stock, timeframe }: { stock: Stock; timeframe: Timeframe }) {
  const points = timeframe === '1D' ? stock.intradayData || [] : stock.dailyData || []
  if (points.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No {timeframe} bars for {stock.symbol}
      </div>
    )
  }

  const width = 760
  const height = 280
  const pad = { top: 18, right: 14, bottom: 30, left: 58 }
  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const up = (timeframe === '1D' ? stock.changePercent : stock.swing.ret63d || 0) >= 0

  const xy = (i: number, price: number) => ({
    x: pad.left + (i / Math.max(points.length - 1, 1)) * plotW,
    y: pad.top + (1 - (price - min) / range) * plotH,
  })

  const path = points
    .map((p, i) => {
      const { x, y } = xy(i, p.price)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')

  const overlays =
    timeframe === '3M'
      ? [
          { label: '20', value: stock.swing.sma20, color: '#38bdf8' },
          { label: '50', value: stock.swing.sma50, color: '#a78bfa' },
          { label: '200', value: stock.swing.sma200, color: '#fbbf24' },
        ]
      : []

  const yTicks = [min, min + range / 2, max]
  const xIdx = [0, Math.floor(points.length / 2), points.length - 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
      {yTicks.map((v) => {
        const y = pad.top + (1 - (v - min) / range) * plotH
        return (
          <g key={v}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#27272a" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#71717a" fontSize="11">
              {money(v, stock.currency)}
            </text>
          </g>
        )
      })}
      {overlays.map((o) => {
        if (o.value == null || o.value < min || o.value > max) return null
        const y = pad.top + (1 - (o.value - min) / range) * plotH
        return (
          <g key={o.label}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke={o.color}
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text x={width - pad.right} y={y - 4} textAnchor="end" fill={o.color} fontSize="10">
              SMA{o.label}
            </text>
          </g>
        )
      })}
      <path d={path} fill="none" stroke={up ? '#34d399' : '#f87171'} strokeWidth="2.2" />
      {xIdx.map((idx) => {
        const { x } = xy(idx, points[idx].price)
        return (
          <text key={idx} x={x} y={height - 8} textAnchor="middle" fill="#71717a" fontSize="11">
            {chartLabel(points[idx].timestamp, timeframe)}
          </text>
        )
      })}
    </svg>
  )
}

function optionsBands(stock: Stock) {
  const atr = stock.swing.atr14
  if (!atr) return null
  const week = expectedMove(atr, 5)
  const month = expectedMove(atr, 21)
  const p = stock.price
  return {
    weekPct: (week / p) * 100,
    monthPct: (month / p) * 100,
    weekUp: p + week,
    weekDown: p - week,
    monthUp: p + month,
    monthDown: p - month,
    callStart: p + week * 0.5,
    putStart: p - week * 0.5,
  }
}

export default function DashPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [earnings, setEarnings] = useState<Earnings[]>([])
  const [macro, setMacro] = useState<MacroEvent[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [selected, setSelected] = useState('NVDA')
  const [group, setGroup] = useState('All')
  const [timeframe, setTimeframe] = useState<Timeframe>('3M')
  const [tab, setTab] = useState<Tab>('interviews')
  const [interviewFilter, setInterviewFilter] = useState('All')
  const [asOf, setAsOf] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const [stocksRes, newsRes, tweetsRes, catRes, intRes] = await Promise.all([
        fetch('/api/markets/stocks'),
        fetch('/api/markets/news'),
        fetch('/api/markets/tweets'),
        fetch('/api/markets/catalysts'),
        fetch('/api/markets/interviews'),
      ])
      const stocksJson = await stocksRes.json()
      const newsJson = await newsRes.json()
      const tweetsJson = await tweetsRes.json()
      const catJson = await catRes.json()
      const intJson = await intRes.json()

      if (!stocksRes.ok || !stocksJson.stocks?.length) {
        throw new Error(stocksJson.error || 'Could not load quotes')
      }

      setStocks(stocksJson.stocks)
      setNews(newsJson.articles || [])
      setTweets(tweetsJson.tweets || [])
      setEarnings(catJson.earnings || [])
      setMacro(catJson.macro || [])
      setNotes(catJson.notes || [])
      setInterviews(intJson.videos || [])
      setAsOf(stocksJson.asOf || new Date().toISOString())
      setError(null)
      setSelected((prev) =>
        stocksJson.stocks.some((s: Stock) => s.symbol === prev)
          ? prev
          : stocksJson.stocks[0].symbol
      )
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(() => load(), 90_000)
    return () => clearInterval(id)
  }, [load])

  const theme = THEME_GROUPS.find((g) => g.label === group)?.theme || 'all'
  const visible = useMemo(
    () => (theme === 'all' ? stocks : stocks.filter((s) => s.theme === theme)),
    [stocks, theme]
  )

  useEffect(() => {
    if (!visible.length) return
    if (!visible.some((s) => s.symbol === selected)) {
      setSelected(visible[0].symbol)
    }
  }, [visible, selected])

  const selectedStock = useMemo(
    () => visible.find((s) => s.symbol === selected) || visible[0] || stocks[0],
    [stocks, selected, visible]
  )

  const qqq = stocks.find((s) => s.symbol === 'QQQ')
  const btc = stocks.find((s) => s.symbol === 'BTC')
  const gld = stocks.find((s) => s.symbol === 'GLD')
  const riskScore = (qqq?.changePercent || 0) * 0.45 + (btc?.changePercent || 0) * 0.35 - (gld?.changePercent || 0) * 0.2

  const earningsBySymbol = useMemo(() => {
    const map = new Map<string, Earnings>()
    for (const e of earnings) {
      if (!map.has(e.symbol)) map.set(e.symbol, e)
    }
    return map
  }, [earnings])

  const interviewTags = useMemo(() => {
    const tags = new Set<string>()
    interviews.forEach((v) => v.related.forEach((t) => tags.add(t)))
    return ['All', ...Array.from(tags).sort()]
  }, [interviews])

  const filteredInterviews = useMemo(() => {
    if (interviewFilter === 'All') return interviews
    return interviews.filter((v) => v.related.includes(interviewFilter))
  }, [interviews, interviewFilter])

  const bands = selectedStock ? optionsBands(selectedStock) : null
  const sessionLabel =
    selectedStock?.marketState === 'PRE'
      ? 'Premarket'
      : selectedStock?.marketState === 'POST'
        ? 'After-hours'
        : selectedStock?.marketState === 'REGULAR'
          ? 'Regular'
          : 'Last'

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
        <p className="text-sm text-zinc-400">Loading markets…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-col gap-3 border-b border-zinc-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-400/80">DiFazio · Markets</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Dash</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Board-first watchlist with premarket, charts, catalysts, and founder/analyst interviews.
              {asOf
                ? ` Updated ${new Date(asOf).toLocaleTimeString('en-US', {
                    timeZone: 'America/New_York',
                    hour: 'numeric',
                    minute: '2-digit',
                  })} ET.`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: 'Risk tone', value: pct(riskScore), sub: riskScore >= 0 ? 'Risk-on lean' : 'Risk-off lean', t: riskScore },
            { label: 'QQQ', value: qqq ? money(qqq.price) : '—', sub: pct(qqq?.changePercent), t: qqq?.changePercent },
            { label: 'BTC', value: btc ? money(btc.price) : '—', sub: pct(btc?.changePercent), t: btc?.changePercent },
            { label: 'GLD', value: gld ? money(gld.price) : '—', sub: pct(gld?.changePercent), t: gld?.changePercent },
            {
              label: 'Next macro',
              value: macro[0] ? `${macro[0].daysUntil}d` : '—',
              sub: macro[0]?.title || '—',
              t: 0,
            },
            {
              label: 'Next earnings',
              value: earnings[0] ? `${earnings[0].symbol} ${earnings[0].daysUntil}d` : '—',
              sub: earnings[0]?.date || '—',
              t: 0,
            },
          ].map((card) => (
            <div key={card.label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">{card.label}</p>
              <p className={`mt-1 text-lg font-semibold ${tone(card.t)}`}>{card.value}</p>
              <p className="truncate text-xs text-zinc-500">{card.sub}</p>
            </div>
          ))}
        </section>

        <div className="mb-3 flex flex-wrap gap-2">
          {THEME_GROUPS.map((g) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setGroup(g.label)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                group === g.label
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Board first */}
        <section className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-900 text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-3 font-medium">Ticker</th>
                <th className="px-3 py-3 font-medium text-right">Last</th>
                <th className="px-3 py-3 font-medium text-right">Day</th>
                <th className="px-3 py-3 font-medium text-right">Premarket</th>
                <th className="px-3 py-3 font-medium text-right">1m</th>
                <th className="px-3 py-3 font-medium text-right">RS</th>
                <th className="px-3 py-3 font-medium text-right">RSI</th>
                <th className="px-3 py-3 font-medium">Trend</th>
                <th className="px-3 py-3 font-medium">Earn</th>
                <th className="hidden px-3 py-3 font-medium md:table-cell">Session</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const active = selectedStock?.symbol === s.symbol
                const earn = earningsBySymbol.get(s.symbol)
                const pre = s.preMarket
                return (
                  <tr
                    key={s.symbol}
                    onClick={() => setSelected(s.symbol)}
                    className={`cursor-pointer border-t border-zinc-800/80 hover:bg-zinc-900/80 ${
                      active ? 'bg-zinc-900' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 font-semibold text-white">
                      {s.symbol}
                      {s.marketState === 'PRE' && (
                        <span className="ml-2 text-[10px] font-medium uppercase text-amber-300">Pre</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{money(s.price, s.currency)}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${tone(s.changePercent)}`}>
                      {pct(s.changePercent)}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${tone(pre?.changePercent)}`}>
                      {pre ? (
                        <span title={money(pre.price, s.currency)}>
                          {pct(pre.changePercent)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${tone(s.swing.ret21d)}`}>
                      {pct(s.swing.ret21d)}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${tone(s.rs21vsQqq)}`}>
                      {pct(s.rs21vsQqq)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">
                      {num(s.swing.rsi14, 0)}
                    </td>
                    <td className="px-3 py-2.5 capitalize text-zinc-400">{s.swing.trend}</td>
                    <td className="px-3 py-2.5 text-zinc-400">
                      {earn ? (
                        <span className={earn.daysUntil <= 14 ? 'text-amber-300' : ''}>{earn.daysUntil}d</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="hidden px-3 py-2.5 md:table-cell">
                      <Sparkline points={s.intradayData || []} up={s.changePercent >= 0} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* Selected chart */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            {selectedStock && (
              <>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-white">{selectedStock.symbol}</h2>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                        {sessionLabel}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          selectedStock.swing.trend === 'bullish'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : selectedStock.swing.trend === 'bearish'
                              ? 'bg-red-500/15 text-red-300'
                              : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {selectedStock.swing.trend}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">{selectedStock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">
                      {money(selectedStock.price, selectedStock.currency)}
                    </p>
                    <p className={`text-sm font-medium ${tone(selectedStock.changePercent)}`}>
                      {pct(selectedStock.changePercent, 2)} vs prior close
                      {selectedStock.preMarket
                        ? ` · pre ${pct(selectedStock.preMarket.changePercent, 2)}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="mb-3 flex gap-2">
                  {(['3M', '1D'] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${
                        timeframe === tf
                          ? 'bg-zinc-100 text-zinc-950'
                          : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {tf === '3M' ? 'Swing (3M)' : 'Intraday'}
                    </button>
                  ))}
                </div>

                <PriceChart stock={selectedStock} timeframe={timeframe} />

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400 sm:grid-cols-4">
                  <div>
                    Premarket{' '}
                    <span className={`font-medium ${tone(selectedStock.preMarket?.changePercent)}`}>
                      {selectedStock.preMarket
                        ? `${money(selectedStock.preMarket.price)} (${pct(selectedStock.preMarket.changePercent)})`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    RSI{' '}
                    <span className="font-medium text-zinc-200">{num(selectedStock.swing.rsi14)}</span>
                  </div>
                  <div>
                    ATR%{' '}
                    <span className="font-medium text-zinc-200">{num(selectedStock.swing.atrPct)}%</span>
                  </div>
                  <div>
                    RS vs QQQ{' '}
                    <span className={`font-medium ${tone(selectedStock.rs21vsQqq)}`}>
                      {pct(selectedStock.rs21vsQqq)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h3 className="text-sm font-medium text-zinc-300">Options map</h3>
            <p className="mt-1 text-xs text-zinc-500">
              ATR×√days expected-move proxy for strike zones. Not implied vol.
            </p>
            {bands && selectedStock ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase text-zinc-500">~1 week</p>
                    <p className="mt-1 font-medium text-zinc-100">
                      {money(bands.weekDown)} – {money(bands.weekUp)}
                    </p>
                    <p className="text-xs text-zinc-500">{pct(bands.weekPct)} band</p>
                  </div>
                  <div className="rounded-md bg-zinc-950/70 p-3">
                    <p className="text-[11px] uppercase text-zinc-500">~1 month</p>
                    <p className="mt-1 font-medium text-zinc-100">
                      {money(bands.monthDown)} – {money(bands.monthUp)}
                    </p>
                    <p className="text-xs text-zinc-500">{pct(bands.monthPct)} band</p>
                  </div>
                </div>
                <div className="rounded-md border border-zinc-800 p-3 text-xs text-zinc-400">
                  <p>
                    Call zone above {money(bands.callStart)} · put zone below {money(bands.putStart)}
                  </p>
                  <p className="mt-1">Prefer 21–45 DTE for swings. Respect earnings / FOMC inside 7 days.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {[
                    ['20', selectedStock.swing.aboveSma20],
                    ['50', selectedStock.swing.aboveSma50],
                    ['200', selectedStock.swing.aboveSma200],
                  ].map(([label, above]) => (
                    <div key={String(label)} className="rounded-md bg-zinc-950/70 p-2">
                      <p className="text-zinc-500">SMA{label}</p>
                      <p className={above ? 'text-emerald-400' : 'text-red-400'}>
                        {above == null ? '—' : above ? 'Above' : 'Below'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">ATR unavailable.</p>
            )}
          </section>
        </div>

        {/* Tabs */}
        <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex flex-wrap gap-1 border-b border-zinc-800 p-2">
            {(
              [
                ['interviews', 'Interviews'],
                ['catalysts', 'Catalysts'],
                ['news', 'News'],
                ['social', 'Social'],
                ['playbook', 'Playbook'],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  tab === id ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5">
            {tab === 'interviews' && (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200">Founder / CEO / analyst interviews</h3>
                    <p className="text-xs text-zinc-500">
                      Latest YouTube podcasts & interviews (Gavin Baker, Jensen, Saylor, Karp, etc.)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {interviewTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setInterviewFilter(tag)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          interviewFilter === tag
                            ? 'bg-zinc-100 text-zinc-950'
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredInterviews.length === 0 ? (
                  <p className="text-sm text-zinc-500">No interviews loaded yet. Hit Refresh.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredInterviews.map((v) => (
                      <a
                        key={v.id}
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/50 hover:border-zinc-600"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.thumbnail}
                          alt=""
                          className="aspect-video w-full object-cover opacity-90 transition group-hover:opacity-100"
                        />
                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-medium text-zinc-100 group-hover:text-emerald-300">
                            {v.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {v.channel}
                            {v.publishedLabel ? ` · ${v.publishedLabel}` : ''}
                          </p>
                          {v.related?.length > 0 && (
                            <p className="mt-1 text-[11px] text-zinc-600">{v.related.join(' · ')}</p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'catalysts' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-medium text-zinc-200">Watchlist earnings</h3>
                  <ul className="space-y-2">
                    {earnings.map((e) => (
                      <li key={`${e.symbol}-${e.date}`}>
                        <button
                          type="button"
                          onClick={() => setSelected(e.symbol)}
                          className="flex w-full items-start justify-between gap-3 rounded-md border border-zinc-800/80 px-3 py-2 text-left hover:bg-zinc-950/50"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">
                              {e.symbol} <span className="font-normal text-zinc-500">{e.date}</span>
                            </p>
                            <p className="text-xs text-zinc-500">
                              {e.time}
                              {e.epsForecast ? ` · cons. ${e.epsForecast}` : ''}
                            </p>
                          </div>
                          <span className={`text-xs font-medium ${e.daysUntil <= 7 ? 'text-amber-300' : 'text-zinc-400'}`}>
                            {e.daysUntil}d
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-zinc-200">Macro / OPEX</h3>
                  <ul className="space-y-2">
                    {macro.map((m) => (
                      <li key={m.title + m.date} className="rounded-md border border-zinc-800/80 px-3 py-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-white">{m.title}</p>
                          <span className="text-xs text-zinc-400">{m.daysUntil}d</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {m.date} · {m.note}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {notes.map((n) => (
                    <p key={n} className="mt-3 text-xs text-zinc-500">
                      {n}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {tab === 'news' && (
              <ul className="space-y-3">
                {news.slice(0, 14).map((article) => (
                  <li key={article.url + article.title} className="border-t border-zinc-800 pt-3 first:border-0 first:pt-0">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-zinc-100 hover:text-emerald-300"
                    >
                      {article.title}
                    </a>
                    <p className="mt-1 text-xs text-zinc-500">
                      {article.related ? `${article.related} · ` : ''}
                      {article.source} · {relativeTime(article.publishedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {tab === 'social' && (
              <ul className="space-y-3">
                {tweets.length === 0 && (
                  <li className="text-sm text-zinc-500">Social feed empty right now (API limits).</li>
                )}
                {tweets.map((t) => (
                  <li key={t.id} className="border-t border-zinc-800 pt-3 first:border-0 first:pt-0">
                    <a href={t.url} target="_blank" rel="noreferrer" className="text-sm text-zinc-200 hover:text-emerald-300">
                      {t.text}
                    </a>
                    <p className="mt-1 text-xs text-zinc-500">
                      @{t.authorHandle} · {relativeTime(t.timestamp)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {tab === 'playbook' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-zinc-200">Weekly / monthly options checklist</h3>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
                    <li>Bias from 3M trend + SMA stack first, not the 5m chart.</li>
                    <li>Confirm relative strength vs QQQ before buying directional premium.</li>
                    <li>Size with ATR bands; prefer 21–45 DTE.</li>
                    <li>If earnings/FOMC/CPI is inside 7 days, define risk or wait.</li>
                    <li>Write invalidation before entry.</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-200">Book notes</h3>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                    <li>• MSTR/CLSK/BMNR = BTC beta — check BTC before equity entries.</li>
                    <li>• NVDA/MU/PLTR often move as one AI complex.</li>
                    <li>• SPCX/TSLA narrative correlation spikes on Musk headlines.</li>
                    <li>• Use Interviews tab for catalyst context before sizing swings.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Not investment advice ·{' '}
          <span className="text-zinc-400">difaziotennis.com/dash</span>
        </p>
      </div>
    </main>
  )
}
