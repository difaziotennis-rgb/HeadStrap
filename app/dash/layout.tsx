import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Finance Dash | DiFazio Tennis',
  description: 'Personal watchlist: quotes, intraday charts, news, and social buzz.',
  robots: { index: false, follow: false },
}

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return children
}
