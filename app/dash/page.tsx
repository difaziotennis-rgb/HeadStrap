'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type IntradayPoint = {
  timestamp: number
  price: number
  volume: number
}

type Stock = {
  symbol: string
  name: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  dayHigh: number | null
  dayLow: number | null
  marketState: string
  currency: string
  intradayData: IntradayPoint[]
}

type NewsArticle = {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  related?: string
}

type Tweet = {
  id: string
  text: string
  author: string
  authorHandle: string
  timestamp: number
  likes?: number
  retweets?: number
  url: string
}

const GROUPS: { label: string; symbols: string[] }[] = [
  { label: 'All', symbols: [] },
  { label: 'AI / Semis', symbols: ['NVDA', 'MU', 'PLTR', 'BOT'] },
  { label: 'Crypto', symbols: ['BTC', 'ETH', 'MSTR', 'CLSK', 'BMNR'] },
  { label: 'Mega / Index', symbols: ['AAPL', 'AMZN', 'TSLA', 'QQQ', 'SPCX'] },
  { label: 'Hedges', symbols: ['GLD', 'COPX', 'LMND'] },
]

function money(n: number, currency = 'USD') {
  if (n >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function pct(n: number) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function timeLabel(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function relativeTime(isoOrSec: string | number) {
  const ms = typeof isoOrSec === 'number' ? isoOrSec * 1000 : new Date(isoOrSec).getTime()
  const diff = Date.now() - ms
  const mins = Math.max(0, Math.round(diff / 60000))
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 36) return `${hrs}h`
  return `${Math.round(hrs / 24)}d`
}

function Sparkline({
  points,
  up,
  width = 120,
  height = 36,
}: {
  points: IntradayPoint[]
  up: boolean
  width?: number
  height?: number
}) {
  if (!points.length) return null
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
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={up ? '#34d399' : '#f87171'}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords}
      />
    </svg>
  )
}

function DayChart({ stock }: { stock: Stock }) {
  const points = stock.intradayData || []
  if (points.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No intraday bars yet for {stock.symbol}
      </div>
    )
  }

  const width = 720
  const height = 260
  const pad = { top: 16, right: 16, bottom: 28, left: 56 }
  const prices = points.map((p) => p.price)
  const min = Math.min(...prices, stock.dayLow ?? prices[0])
  const max = Math.max(...prices, stock.dayHigh ?? prices[0])
  const range = max - min || 1
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const up = stock.changePercent >= 0

  const path = points
    .map((p, i) => {
      const x = pad.left + (i / Math.max(points.length - 1, 1)) * plotW
      const y = pad.top + (1 - (p.price - min) / range) * plotH
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')

  const area =
    path +
    ` L${pad.left + plotW},${pad.top + plotH} L${pad.left},${pad.top + plotH} Z`

  const yTicks = [min, min + range / 2, max]
  const xLabels = [0, Math.floor(points.length / 2), points.length - 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
      <defs>
        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? '#34d399' : '#f87171'} stopOpacity="0.22" />
          <stop offset="100%" stopColor={up ? '#34d399' : '#f87171'} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v) => {
        const y = pad.top + (1 - (v - min) / range) * plotH
        return (
          <g key={v}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke="#27272a"
              strokeWidth="1"
            />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#71717a" fontSize="11">
              {money(v, stock.currency)}
            </text>
          </g>
        )
      })}
      <path d={area} fill="url(#fill)" />
      <path d={path} fill="none" stroke={up ? '#34d399' : '#f87171'} strokeWidth="2.25" />
      {xLabels.map((idx) => {
        const x = pad.left + (idx / Math.max(points.length - 1, 1)) * plotW
        return (
          <text key={idx} x={x} y={height - 8} textAnchor="middle" fill="#71717a" fontSize="11">
            {timeLabel(points[idx].timestamp)}
          </text>
        )
      })}
    </svg>
  )
}

export default function DashPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [selected, setSelected] = useState('NVDA')
  const [group, setGroup] = useState('All')
  const [asOf, setAsOf] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const [stocksRes, newsRes, tweetsRes] = await Promise.all([
        fetch('/api/markets/stocks'),
        fetch('/api/markets/news'),
        fetch('/api/markets/tweets'),
      ])
      const stocksJson = await stocksRes.json()
      const newsJson = await newsRes.json()
      const tweetsJson = await tweetsRes.json()

      if (!stocksRes.ok || !stocksJson.stocks?.length) {
        throw new Error(stocksJson.error || 'Could not load quotes')
      }

      setStocks(stocksJson.stocks)
      setNews(newsJson.articles || [])
      setTweets(tweetsJson.tweets || [])
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
    const id = setInterval(() => load(), 60_000)
    return () => clearInterval(id)
  }, [load])

  const visible = useMemo(() => {
    const g = GROUPS.find((x) => x.label === group)
    if (!g || !g.symbols.length) return stocks
    return stocks.filter((s) => g.symbols.includes(s.symbol))
  }, [stocks, group])

  const selectedStock = useMemo(
    () => stocks.find((s) => s.symbol === selected) || visible[0] || stocks[0],
    [stocks, selected, visible]
  )

  const ranked = useMemo(
    () => [...stocks].sort((a, b) => b.changePercent - a.changePercent),
    [stocks]
  )
  const avg =
    stocks.length > 0
      ? stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length
      : 0
  const upCount = stocks.filter((s) => s.changePercent > 0).length
  const downCount = stocks.filter((s) => s.changePercent < 0).length

  const buzz = useMemo(() => {
    return [...stocks]
      .map((s) => {
        const vols = (s.intradayData || []).map((p) => p.volume || 0)
        const avgVol = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0
        const recent = vols.slice(-6)
        const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
        const spike = avgVol ? recentAvg / avgVol : 1
        const score = Math.abs(s.changePercent) * 1.5 + Math.max(0, spike - 1) * 8
        return {
          symbol: s.symbol,
          score,
          level: score >= 8 ? 'Hot' : score >= 4 ? 'Active' : 'Quiet',
          note: `${Math.abs(s.changePercent).toFixed(1)}% move · vol ${spike.toFixed(1)}x vs session avg`,
          changePercent: s.changePercent,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }, [stocks])

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
        <p className="text-sm text-zinc-400">Loading watchlist…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">DiFazio · Markets</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
              Finance dash
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {asOf
                ? `Updated ${new Date(asOf).toLocaleTimeString('en-US', {
                    timeZone: 'America/New_York',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                  })} ET · auto-refresh 60s`
                : 'Live watchlist'}
              {' · '}
              {upCount} up / {downCount} down · avg {pct(avg)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">Watchlist avg</p>
            <p className={`mt-1 text-2xl font-semibold ${avg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {pct(avg)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">Top gainer</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">
              {ranked[0] ? `${ranked[0].symbol} ${pct(ranked[0].changePercent)}` : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">Top laggard</p>
            <p className="mt-1 text-2xl font-semibold text-red-400">
              {ranked.length
                ? `${ranked[ranked.length - 1].symbol} ${pct(ranked[ranked.length - 1].changePercent)}`
                : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">BTC</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                (stocks.find((s) => s.symbol === 'BTC')?.changePercent || 0) >= 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {stocks.find((s) => s.symbol === 'BTC')
                ? money(stocks.find((s) => s.symbol === 'BTC')!.price)
                : '—'}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setGroup(g.label)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                group === g.label
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            {selectedStock && (
              <>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{selectedStock.symbol}</h2>
                    <p className="text-sm text-zinc-400">{selectedStock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">{money(selectedStock.price, selectedStock.currency)}</p>
                    <p
                      className={`text-sm font-medium ${
                        selectedStock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {selectedStock.change >= 0 ? '+' : ''}
                      {selectedStock.change.toFixed(2)} ({pct(selectedStock.changePercent)})
                    </p>
                  </div>
                </div>
                <p className="mb-2 text-xs text-zinc-500">
                  Session range{' '}
                  {money(selectedStock.dayLow ?? selectedStock.price, selectedStock.currency)} –{' '}
                  {money(selectedStock.dayHigh ?? selectedStock.price, selectedStock.currency)} · 5m
                  bars
                </p>
                <DayChart stock={selectedStock} />
              </>
            )}
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-300">Leaders</h3>
              <ul className="space-y-2">
                {ranked.slice(0, 5).map((s) => (
                  <li key={s.symbol} className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setSelected(s.symbol)}
                      className="font-medium text-zinc-200 hover:text-white"
                    >
                      {s.symbol}
                    </button>
                    <span className="text-emerald-400">{pct(s.changePercent)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-300">Laggards</h3>
              <ul className="space-y-2">
                {ranked
                  .slice(-5)
                  .reverse()
                  .map((s) => (
                    <li key={s.symbol} className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => setSelected(s.symbol)}
                        className="font-medium text-zinc-200 hover:text-white"
                      >
                        {s.symbol}
                      </button>
                      <span className={s.changePercent < 0 ? 'text-red-400' : 'text-zinc-400'}>
                        {pct(s.changePercent)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </section>
        </div>

        <section className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ticker</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium text-right">Last</th>
                <th className="px-4 py-3 font-medium text-right">Chg %</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Session</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const up = s.changePercent >= 0
                const active = selectedStock?.symbol === s.symbol
                return (
                  <tr
                    key={s.symbol}
                    onClick={() => setSelected(s.symbol)}
                    className={`cursor-pointer border-t border-zinc-800/80 transition hover:bg-zinc-900/80 ${
                      active ? 'bg-zinc-900' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-white">{s.symbol}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-zinc-400">{s.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(s.price, s.currency)}</td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-medium ${
                        up ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {pct(s.changePercent)}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Sparkline points={s.intradayData || []} up={up} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            <h2 className="mb-1 text-lg font-semibold text-white">News & business</h2>
            <p className="mb-4 text-xs text-zinc-500">Watchlist + macro headlines</p>
            <ul className="space-y-3">
              {news.length === 0 && (
                <li className="text-sm text-zinc-500">No headlines available right now.</li>
              )}
              {news.slice(0, 12).map((article) => (
                <li key={article.url + article.title} className="border-t border-zinc-800 pt-3 first:border-0 first:pt-0">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm font-medium text-zinc-100 hover:text-emerald-300"
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
          </section>

          <section className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
              <h2 className="mb-1 text-lg font-semibold text-white">Flow buzz</h2>
              <p className="mb-4 text-xs text-zinc-500">Move size + volume spike vs session average</p>
              <ul className="space-y-3">
                {buzz.map((b) => (
                  <li key={b.symbol} className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelected(b.symbol)}
                        className="text-sm font-semibold text-white hover:text-emerald-300"
                      >
                        {b.symbol}
                      </button>
                      <p className="text-xs text-zinc-500">{b.note}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        b.level === 'Hot'
                          ? 'bg-amber-500/15 text-amber-300'
                          : b.level === 'Active'
                            ? 'bg-sky-500/15 text-sky-300'
                            : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {b.level}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
              <h2 className="mb-1 text-lg font-semibold text-white">Social buzz</h2>
              <p className="mb-4 text-xs text-zinc-500">High-engagement posts mentioning the tape</p>
              <ul className="space-y-3">
                {tweets.length === 0 && (
                  <li className="text-sm text-zinc-500">
                    No social feed right now (Twitter API may be unavailable on this plan).
                  </li>
                )}
                {tweets.map((t) => (
                  <li key={t.id} className="border-t border-zinc-800 pt-3 first:border-0 first:pt-0">
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-zinc-200 hover:text-emerald-300"
                    >
                      {t.text}
                    </a>
                    <p className="mt-1 text-xs text-zinc-500">
                      @{t.authorHandle} · {relativeTime(t.timestamp)}
                      {typeof t.likes === 'number' ? ` · ${t.likes} likes` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          Not investment advice. Quotes via Yahoo Finance. Bookmark{' '}
          <span className="text-zinc-400">difaziotennis.com/dash</span>
        </p>
      </div>
    </main>
  )
}
