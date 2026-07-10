import { NextResponse } from 'next/server'

type InterviewVideo = {
  id: string
  title: string
  channel: string
  publishedLabel: string
  url: string
  thumbnail: string
  query: string
  related: string[]
}

const SEARCHES: { query: string; related: string[] }[] = [
  { query: 'Gavin Baker interview OR podcast', related: ['NVDA', 'SPCX', 'AI'] },
  { query: 'Jensen Huang interview NVIDIA', related: ['NVDA'] },
  { query: 'Michael Saylor interview Bitcoin OR Strategy', related: ['MSTR', 'BTC'] },
  { query: 'Elon Musk interview Tesla OR SpaceX', related: ['TSLA', 'SPCX'] },
  { query: 'Alex Karp Palantir interview', related: ['PLTR'] },
  { query: 'Lisa Su AMD interview OR Micron CEO interview', related: ['MU', 'NVDA'] },
  { query: 'Tim Cook interview Apple', related: ['AAPL'] },
  { query: 'Andy Jassy interview Amazon', related: ['AMZN'] },
  { query: 'TBPN NVIDIA OR SpaceX OR AI interview', related: ['NVDA', 'SPCX'] },
  { query: 'Invest Like The Best AI infrastructure OR semiconductors', related: ['NVDA', 'MU'] },
]

function walkVideos(node: any, out: any[]) {
  if (!node) return
  if (Array.isArray(node)) {
    node.forEach((child) => walkVideos(child, out))
    return
  }
  if (typeof node !== 'object') return
  if (node.videoRenderer) {
    out.push(node.videoRenderer)
    return
  }
  for (const value of Object.values(node)) walkVideos(value, out)
}

function parsePublishedRank(label: string | undefined): number {
  if (!label) return 0
  const lower = label.toLowerCase()
  const num = parseFloat(lower)
  if (Number.isNaN(num)) return 0
  if (lower.includes('minute')) return 1_000_000 - num
  if (lower.includes('hour')) return 900_000 - num * 60
  if (lower.includes('day')) return 800_000 - num * 1440
  if (lower.includes('week')) return 700_000 - num * 10000
  if (lower.includes('month')) return 600_000 - num * 40000
  if (lower.includes('year')) return 100_000 - num * 100000
  return 0
}

/** Approximate age in days from YouTube relative labels like "3 hours ago". */
function approximateAgeDays(label: string | undefined): number | null {
  if (!label) return null
  const lower = label.toLowerCase().trim()
  if (lower === 'streamed' || lower.includes('live')) return 0
  const numMatch = lower.match(/(\d+(\.\d+)?)/)
  const num = numMatch ? parseFloat(numMatch[1]) : NaN
  if (lower.includes('second') || lower.includes('minute') || lower.includes('hour')) {
    return 0
  }
  if (lower.includes('day')) {
    if (Number.isNaN(num)) return 1
    return num
  }
  if (lower.includes('week')) {
    if (Number.isNaN(num)) return 7
    return num * 7
  }
  if (lower.includes('month')) {
    if (Number.isNaN(num)) return 30
    return num * 30
  }
  if (lower.includes('year')) {
    if (Number.isNaN(num)) return 365
    return num * 365
  }
  // Unknown label — exclude from "recent" feed
  return null
}

const MAX_AGE_DAYS = 4

function isRecent(label: string | undefined): boolean {
  const age = approximateAgeDays(label)
  return age != null && age <= MAX_AGE_DAYS
}

async function searchYouTube(query: string): Promise<InterviewVideo[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAI%253D`
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    next: { revalidate: 900 },
  })
  if (!response.ok) return []
  const html = await response.text()
  const match = html.match(/ytInitialData\s*=\s*(\{.+?\});<\/script>/)
  if (!match) return []

  let data: any
  try {
    data = JSON.parse(match[1])
  } catch {
    return []
  }

  const renderers: any[] = []
  walkVideos(data, renderers)

  const videos: InterviewVideo[] = []
  for (const v of renderers) {
    const id = v.videoId
    const title = v.title?.runs?.[0]?.text || v.title?.simpleText
    if (!id || !title) continue
    const channel = v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'YouTube'
    const publishedLabel = v.publishedTimeText?.simpleText || ''
    // Prefer interview/podcast/conversation style content
    const hay = `${title} ${channel}`.toLowerCase()
    const looksUseful =
      hay.includes('interview') ||
      hay.includes('podcast') ||
      hay.includes('conversation') ||
      hay.includes('fireside') ||
      hay.includes('keynote') ||
      hay.includes('q&a') ||
      hay.includes('ep.') ||
      hay.includes('episode') ||
      hay.includes(' sits down') ||
      hay.includes('talks with')
    if (!looksUseful) continue
    if (!isRecent(publishedLabel)) continue

    videos.push({
      id,
      title,
      channel,
      publishedLabel,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      query,
      related: [],
    })
  }
  return videos
}

export async function GET() {
  try {
    const collected: InterviewVideo[] = []
    const seen = new Set<string>()

    for (const search of SEARCHES) {
      try {
        const videos = await searchYouTube(search.query)
        for (const video of videos.slice(0, 8)) {
          if (seen.has(video.id)) continue
          seen.add(video.id)
          collected.push({ ...video, related: search.related })
        }
      } catch (error) {
        console.error('interview search fail', search.query, error)
      }
    }

    collected.sort(
      (a, b) => parsePublishedRank(b.publishedLabel) - parsePublishedRank(a.publishedLabel)
    )

    return NextResponse.json({
      videos: collected.slice(0, 24),
      asOf: new Date().toISOString(),
      maxAgeDays: MAX_AGE_DAYS,
      note: `Only interviews/podcasts from roughly the past ${MAX_AGE_DAYS} days (YouTube relative timestamps).`,
    })
  } catch (error: any) {
    console.error('interviews error', error)
    return NextResponse.json({
      videos: [],
      asOf: new Date().toISOString(),
      maxAgeDays: MAX_AGE_DAYS,
      error: error.message || 'Failed to load interviews',
    })
  }
}
