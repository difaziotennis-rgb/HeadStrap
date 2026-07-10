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
  voice?: string
}

/**
 * Person/show searches: accept clips if the voice name appears (CNBC hits, short clips, etc.).
 * Topic searches: still require interview/podcast-style wording.
 */
const SEARCHES: {
  query: string
  related: string[]
  voice?: string
  /** Extra name aliases that must appear in title/channel for person searches */
  aliases?: string[]
}[] = [
  // Analysts / PMs who clip constantly
  { query: 'Tom Lee Fundstrat', related: ['QQQ', 'ETH', 'BTC'], voice: 'Tom Lee', aliases: ['tom lee', 'fundstrat'] },
  { query: 'Tom Lee CNBC OR Bloomberg', related: ['QQQ', 'ETH'], voice: 'Tom Lee', aliases: ['tom lee'] },
  { query: 'Michael Saylor Bitcoin OR Strategy OR MSTR', related: ['MSTR', 'BTC'], voice: 'Michael Saylor', aliases: ['saylor', 'michael saylor'] },
  { query: 'Michael Saylor interview OR podcast', related: ['MSTR', 'BTC'], voice: 'Michael Saylor', aliases: ['saylor'] },
  { query: 'Gavin Baker Atreides OR interview', related: ['NVDA', 'SPCX', 'AI'], voice: 'Gavin Baker', aliases: ['gavin baker', 'atreides'] },
  { query: 'Cathie Wood ARK OR interview', related: ['QQQ', 'AI'], voice: 'Cathie Wood', aliases: ['cathie wood', 'ark invest', 'cathie'] },
  { query: 'Dan Ives Wedbush OR Tesla OR AI', related: ['TSLA', 'AAPL', 'AI'], voice: 'Dan Ives', aliases: ['dan ives', 'ives'] },
  { query: 'Raoul Pal Real Vision OR Bitcoin OR Ethereum', related: ['BTC', 'ETH'], voice: 'Raoul Pal', aliases: ['raoul pal'] },
  { query: 'Anthony Pompliano Bitcoin OR interview', related: ['BTC', 'MSTR'], voice: 'Pompliano', aliases: ['pompliano', 'pomp'] },
  { query: 'Mark Yusko OR SkyBridge Scaramucci Bitcoin', related: ['BTC'], voice: 'Macro crypto', aliases: ['yusko', 'scaramucci', 'skybridge'] },
  { query: 'Jim Bianco OR inflation OR Fed interview', related: ['QQQ', 'GLD'], voice: 'Jim Bianco', aliases: ['bianco'] },
  { query: 'Jefferies OR Semianalysis OR Dylan Patel AI', related: ['NVDA', 'MU'], voice: 'Semi research', aliases: ['dylan patel', 'semianalysis', 'jefferies'] },

  // Founders / CEOs on the book
  { query: 'Jensen Huang NVIDIA interview OR keynote', related: ['NVDA'], voice: 'Jensen Huang', aliases: ['jensen', 'huang', 'nvidia'] },
  { query: 'Elon Musk Tesla OR SpaceX interview OR podcast', related: ['TSLA', 'SPCX'], voice: 'Elon Musk', aliases: ['elon', 'musk'] },
  { query: 'Alex Karp Palantir interview OR CNBC', related: ['PLTR'], voice: 'Alex Karp', aliases: ['karp', 'palantir'] },
  { query: 'Lisa Su AMD interview', related: ['MU', 'NVDA'], voice: 'Lisa Su', aliases: ['lisa su'] },
  { query: 'Tim Cook Apple interview', related: ['AAPL'], voice: 'Tim Cook', aliases: ['tim cook'] },
  { query: 'Andy Jassy Amazon interview', related: ['AMZN'], voice: 'Andy Jassy', aliases: ['jassy'] },
  { query: 'SanDisk OR Micron CEO interview memory chips', related: ['MU'], voice: 'Memory CEOs', aliases: ['micron', 'sanDisk', 'sandisk'] },

  // Shows that congregate these voices
  { query: 'TBPN interview AI OR NVIDIA OR SpaceX', related: ['NVDA', 'SPCX', 'AI'], voice: 'TBPN', aliases: ['tbpn'] },
  { query: 'Invest Like The Best podcast', related: ['NVDA', 'AI'], voice: 'Invest Like The Best', aliases: ['invest like the best', 'patrick oshaughnessy'] },
  { query: 'All-In Podcast Besties', related: ['QQQ', 'AI'], voice: 'All-In', aliases: ['all-in podcast', 'all in podcast', 'chamath', 'sacks'] },
  { query: 'CNBC Squawk Box OR Fast Money Tom Lee OR Saylor', related: ['QQQ', 'BTC'], voice: 'CNBC', aliases: ['tom lee', 'saylor', 'ives', 'cathie'] },
]

const TOPIC_KEYWORDS = [
  'interview',
  'podcast',
  'conversation',
  'fireside',
  'keynote',
  'q&a',
  'ep.',
  'episode',
  ' sits down',
  'talks with',
  'on cnbc',
  'on bloomberg',
  'explains',
  'breaks down',
  'says',
  'call',
  'outlook',
  'prediction',
]

const MAX_AGE_DAYS = 4

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
  const age = approximateAgeDays(label)
  if (age == null) return 0
  return 1_000_000 - age * 10_000
}

/** Approximate age in days from YouTube relative labels. */
function approximateAgeDays(label: string | undefined): number | null {
  if (!label) return null
  let lower = label.toLowerCase().trim()
  lower = lower.replace(/^streamed\s+/, '')

  // Compact forms: 1d ago, 2w ago, 1mo ago
  const compact = lower.match(/^(\d+)\s*(d|w|mo|m|h|hr|hrs|min|mins)\s*ago/)
  if (compact) {
    const n = parseFloat(compact[1])
    const unit = compact[2]
    if (unit === 'min' || unit === 'mins' || unit === 'h' || unit === 'hr' || unit === 'hrs' || unit === 'm') {
      // bare "m" on YT is usually minutes in compact UI; treat as < 1 day
      return 0
    }
    if (unit === 'd') return n
    if (unit === 'w') return n * 7
    if (unit === 'mo') return n * 30
  }

  const numMatch = lower.match(/(\d+(\.\d+)?)/)
  const num = numMatch ? parseFloat(numMatch[1]) : NaN

  if (lower.includes('second') || lower.includes('minute') || lower.includes('hour')) return 0
  if (lower.includes('day')) return Number.isNaN(num) ? 1 : num
  if (lower.includes('week')) return Number.isNaN(num) ? 7 : num * 7
  if (lower.includes('month')) return Number.isNaN(num) ? 30 : num * 30
  if (lower.includes('year')) return Number.isNaN(num) ? 365 : num * 365
  return null
}

function isRecent(label: string | undefined): boolean {
  const age = approximateAgeDays(label)
  return age != null && age <= MAX_AGE_DAYS
}

function matchesVoice(hay: string, aliases: string[] | undefined): boolean {
  if (!aliases?.length) return true
  return aliases.some((alias) => hay.includes(alias.toLowerCase()))
}

function looksLikeInterviewContent(hay: string): boolean {
  return TOPIC_KEYWORDS.some((k) => hay.includes(k))
}

async function searchYouTube(
  query: string,
  opts: { aliases?: string[]; requireTopicKeywords?: boolean }
): Promise<InterviewVideo[]> {
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
    if (!isRecent(publishedLabel)) continue

    const hay = `${title} ${channel}`.toLowerCase()

    // Person searches: require the voice name/alias in title or channel.
    if (opts.aliases?.length) {
      if (!matchesVoice(hay, opts.aliases)) continue
    } else if (!looksLikeInterviewContent(hay)) {
      continue
    }

    // Soft preference: still allow CNBC/Bloomberg clip titles without "interview"
    // when aliases matched; for non-alias topic searches we already required keywords.

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

    // Parallelize in small batches to stay thorough without serial timeouts.
    const batchSize = 6
    for (let i = 0; i < SEARCHES.length; i += batchSize) {
      const batch = SEARCHES.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async (search) => {
          try {
            const videos = await searchYouTube(search.query, {
              aliases: search.aliases,
              requireTopicKeywords: !search.aliases?.length,
            })
            return { search, videos }
          } catch (error) {
            console.error('interview search fail', search.query, error)
            return { search, videos: [] as InterviewVideo[] }
          }
        })
      )

      for (const { search, videos } of results) {
        for (const video of videos.slice(0, 10)) {
          if (seen.has(video.id)) continue
          seen.add(video.id)
          collected.push({
            ...video,
            related: search.related,
            voice: search.voice,
          })
        }
      }
    }

    collected.sort(
      (a, b) => parsePublishedRank(b.publishedLabel) - parsePublishedRank(a.publishedLabel)
    )

    return NextResponse.json({
      videos: collected.slice(0, 40),
      asOf: new Date().toISOString(),
      maxAgeDays: MAX_AGE_DAYS,
      voices: Array.from(new Set(SEARCHES.map((s) => s.voice).filter(Boolean))),
      note: `Recent clips (≈${MAX_AGE_DAYS}d) from Saylor, Tom Lee, Gavin Baker, Cathie Wood, Dan Ives, founders/CEOs, and related shows.`,
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
