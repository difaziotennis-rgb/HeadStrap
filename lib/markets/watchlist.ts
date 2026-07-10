export const MARKET_WATCHLIST = [
  { display: 'NVDA', yahoo: 'NVDA', kind: 'equity' as const, theme: 'ai' },
  { display: 'CLSK', yahoo: 'CLSK', kind: 'equity' as const, theme: 'crypto' },
  { display: 'TSLA', yahoo: 'TSLA', kind: 'equity' as const, theme: 'mega' },
  { display: 'LMND', yahoo: 'LMND', kind: 'equity' as const, theme: 'hedge' },
  { display: 'MSTR', yahoo: 'MSTR', kind: 'equity' as const, theme: 'crypto' },
  { display: 'BTC', yahoo: 'BTC-USD', kind: 'crypto' as const, theme: 'crypto' },
  { display: 'ETH', yahoo: 'ETH-USD', kind: 'crypto' as const, theme: 'crypto' },
  { display: 'BMNR', yahoo: 'BMNR', kind: 'equity' as const, theme: 'crypto' },
  { display: 'MU', yahoo: 'MU', kind: 'equity' as const, theme: 'ai' },
  { display: 'PLTR', yahoo: 'PLTR', kind: 'equity' as const, theme: 'ai' },
  { display: 'GLD', yahoo: 'GLD', kind: 'etf' as const, theme: 'hedge' },
  { display: 'COPX', yahoo: 'COPX', kind: 'etf' as const, theme: 'hedge' },
  { display: 'QQQ', yahoo: 'QQQ', kind: 'etf' as const, theme: 'mega' },
  { display: 'AAPL', yahoo: 'AAPL', kind: 'equity' as const, theme: 'mega' },
  { display: 'AMZN', yahoo: 'AMZN', kind: 'equity' as const, theme: 'mega' },
  { display: 'SPCX', yahoo: 'SPCX', kind: 'equity' as const, theme: 'mega' },
  { display: 'BOT', yahoo: 'BOT', kind: 'equity' as const, theme: 'ai' },
] as const

export type WatchTheme = 'ai' | 'crypto' | 'mega' | 'hedge'

export const THEME_GROUPS: { label: string; theme: WatchTheme | 'all' }[] = [
  { label: 'All', theme: 'all' },
  { label: 'AI / Semis', theme: 'ai' },
  { label: 'Crypto complex', theme: 'crypto' },
  { label: 'Mega / Index', theme: 'mega' },
  { label: 'Hedges', theme: 'hedge' },
]

export const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}
