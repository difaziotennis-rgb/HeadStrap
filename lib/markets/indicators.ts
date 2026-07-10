export type OhlcBar = {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null
  const slice = values.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null
  let gains = 0
  let losses = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export function atr(bars: OhlcBar[], period = 14): number | null {
  if (bars.length < period + 1) return null
  const trs: number[] = []
  for (let i = 1; i < bars.length; i++) {
    const prevClose = bars[i - 1].close
    const { high, low } = bars[i]
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)))
  }
  const slice = trs.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

export function returnOver(closes: number[], barsBack: number): number | null {
  if (closes.length <= barsBack) return null
  const now = closes[closes.length - 1]
  const then = closes[closes.length - 1 - barsBack]
  if (!then) return null
  return ((now - then) / then) * 100
}

export function expectedMove(atrValue: number, tradingDays: number): number {
  return atrValue * Math.sqrt(tradingDays)
}

export type SwingMetrics = {
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
  dist52wLowPct: number | null
  volVsAvg20: number | null
  aboveSma20: boolean | null
  aboveSma50: boolean | null
  aboveSma200: boolean | null
  trend:
    | 'bullish'
    | 'bearish'
    | 'mixed'
    | 'unknown'
  stretch:
    | 'extended_up'
    | 'extended_down'
    | 'neutral'
    | 'unknown'
}

export function computeSwingMetrics(
  bars: OhlcBar[],
  fiftyTwoWeekHigh?: number | null,
  fiftyTwoWeekLow?: number | null
): SwingMetrics {
  const closes = bars.map((b) => b.close)
  const volumes = bars.map((b) => b.volume)
  const price = closes[closes.length - 1]
  const sma20 = sma(closes, 20)
  const sma50 = sma(closes, 50)
  const sma200 = sma(closes, 200)
  const rsi14 = rsi(closes, 14)
  const atr14 = atr(bars, 14)
  const atrPct = atr14 && price ? (atr14 / price) * 100 : null
  const avgVol20 = sma(volumes, 20)
  const lastVol = volumes[volumes.length - 1]
  const volVsAvg20 = avgVol20 && lastVol != null ? lastVol / avgVol20 : null

  let trend: SwingMetrics['trend'] = 'unknown'
  if (sma20 != null && sma50 != null && sma200 != null) {
    if (price > sma20 && sma20 > sma50 && sma50 > sma200) trend = 'bullish'
    else if (price < sma20 && sma20 < sma50 && sma50 < sma200) trend = 'bearish'
    else trend = 'mixed'
  }

  let stretch: SwingMetrics['stretch'] = 'unknown'
  if (rsi14 != null) {
    if (rsi14 >= 70) stretch = 'extended_up'
    else if (rsi14 <= 30) stretch = 'extended_down'
    else stretch = 'neutral'
  }

  const high = fiftyTwoWeekHigh ?? Math.max(...closes)
  const low = fiftyTwoWeekLow ?? Math.min(...closes)

  return {
    sma20,
    sma50,
    sma200,
    rsi14,
    atr14,
    atrPct,
    ret5d: returnOver(closes, 5),
    ret21d: returnOver(closes, 21),
    ret63d: returnOver(closes, 63),
    dist52wHighPct: high ? ((price - high) / high) * 100 : null,
    dist52wLowPct: low ? ((price - low) / low) * 100 : null,
    volVsAvg20,
    aboveSma20: sma20 != null ? price > sma20 : null,
    aboveSma50: sma50 != null ? price > sma50 : null,
    aboveSma200: sma200 != null ? price > sma200 : null,
    trend,
    stretch,
  }
}

export function relativeStrength(assetRet: number | null, benchRet: number | null): number | null {
  if (assetRet == null || benchRet == null) return null
  return assetRet - benchRet
}
