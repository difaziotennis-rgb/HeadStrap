'use client'

import { Navigation } from '@/components/tennisclub-navigation'

export default function TennisClubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}

