import { NextResponse } from 'next/server'
import { MARKET_WATCHLIST } from '@/lib/markets/watchlist'

type EarningsRow = {
  date: string
  symbol: string
  name: string
  time: string
  epsForecast: string | null
  daysUntil: number
}

type MacroEvent = {
  date: string
  title: string
  kind: 'fed' | 'inflation' | 'jobs' | 'opex' | 'other'
  note: string
  daysUntil: number
}

function etToday(): Date {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  et.setHours(0, 0, 0, 0)
  return et
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysUntil(dateStr: string): number {
  const today = etToday()
  const target = new Date(`${dateStr}T12:00:00`)
  const t0 = new Date(today)
  t0.setHours(12, 0, 0, 0)
  return Math.round((target.getTime() - t0.getTime()) / 86400000)
}

function thirdFriday(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex, 1)
  let count = 0
  while (count < 3) {
    if (d.getDay() === 5) count += 1
    if (count < 3) d.setDate(d.getDate() + 1)
  }
  return ymd(d)
}

function buildMacroCalendar(): MacroEvent[] {
  const julOpex = thirdFriday(2026, 6)
  const augOpex = thirdFriday(2026, 7)
  const raw: Omit<MacroEvent, 'daysUntil'>[] = [
    {
      date: '2026-07-15',
      title: 'CPI window',
      kind: 'inflation',
      note: 'Confirm BLS time. Index IV often elevates into the print — size smaller or wait.',
    },
    {
      date: julOpex,
      title: 'July monthly OPEX',
      kind: 'opex',
      note: 'Dealer hedging / pin risk into Friday. Prefer defining risk before the final hour.',
    },
    {
      date: '2026-07-29',
      title: 'FOMC decision',
      kind: 'fed',
      note: 'Hold is base case; press conference tone can reprice QQQ, semis, and BTC beta.',
    },
    {
      date: '2026-08-01',
      title: 'Jobs data window',
      kind: 'jobs',
      note: 'Confirm BLS date. Weak/strong payrolls flip risk appetite quickly.',
    },
    {
      date: augOpex,
      title: 'August monthly OPEX',
      kind: 'opex',
      note: 'Plan roll/exit before the last two sessions if you are short gamma.',
    },
  ]

  return raw
    .map((e) => ({ ...e, daysUntil: daysUntil(e.date) }))
    .filter((e) => e.daysUntil >= -1)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

function formatTime(raw: string | null | undefined): string {
  if (!raw) return 'TBD'
  if (raw.includes('pre')) return 'Pre-market'
  if (raw.includes('after')) return 'After close'
  if (raw.includes('not-supplied')) return 'TBD'
  return raw
}

async function fetchNasdaqEarnings(date: string): Promise<any[]> {
  const url = `https://api.nasdaq.com/api/calendar/earnings?date=${date}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json',
    },
    next: { revalidate: 21600 },
  })
  if (!response.ok) return []
  const data = await response.json()
  return data?.data?.rows || []
}

export async function GET() {
  try {
    const watch = new Set<string>(MARKET_WATCHLIST.map((w) => w.display))
    const today = etToday()
    const weekdays: string[] = []
    for (let i = 0; i < 90 && weekdays.length < 55; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      if (d.getDay() === 0 || d.getDay() === 6) continue
      weekdays.push(ymd(d))
    }

    const earnings: EarningsRow[] = []
    const seen = new Set<string>()

    for (let i = 0; i < weekdays.length; i += 8) {
      const chunk = weekdays.slice(i, i + 8)
      const results = await Promise.all(chunk.map((date) => fetchNasdaqEarnings(date)))
      results.forEach((rows, idx) => {
        const date = chunk[idx]
        for (const row of rows) {
          const symbol = String(row.symbol || '').toUpperCase()
          if (!watch.has(symbol)) continue
          const key = `${symbol}-${date}`
          if (seen.has(key)) continue
          seen.add(key)
          earnings.push({
            date,
            symbol,
            name: String(row.name || symbol).trim(),
            time: formatTime(row.time),
            epsForecast: row.epsForecast || null,
            daysUntil: daysUntil(date),
          })
        }
      })
    }

    earnings.sort((a, b) => a.daysUntil - b.daysUntil || a.symbol.localeCompare(b.symbol))

    return NextResponse.json({
      earnings,
      macro: buildMacroCalendar(),
      asOf: new Date().toISOString(),
      notes: [
        'Confirm earnings date/time before holding options through the print.',
        'Dash expected-move bands use ATR×√days — a vol proxy, not exchange IV.',
      ],
    })
  } catch (error: any) {
    console.error('catalysts error', error)
    return NextResponse.json({
      earnings: [],
      macro: buildMacroCalendar(),
      asOf: new Date().toISOString(),
      error: error.message || 'Failed to load catalysts',
    })
  }
}
