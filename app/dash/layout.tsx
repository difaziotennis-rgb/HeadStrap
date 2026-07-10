import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Markets Swing Desk | DiFazio Tennis',
  description:
    'Personal swing-trading desk: watchlist, multi-timeframe charts, ATR options bands, earnings, and macro catalysts.',
  robots: { index: false, follow: false },
}

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return children
}
