import { NextResponse } from 'next/server'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
  related?: string
}

const WATCHLIST_QUERIES = [
  'NVDA',
  'TSLA',
  'MSTR',
  'Bitcoin',
  'PLTR',
  'Micron',
  'SpaceX SPCX',
  'QQQ',
  'Apple stock',
  'Amazon stock',
]

const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
}

async function fetchYahooNews(): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = []
  const seen = new Set<string>()

  for (const q of WATCHLIST_QUERIES) {
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=6&quotesCount=0`
      const response = await fetch(url, {
        headers: YAHOO_HEADERS,
        next: { revalidate: 300 },
      })
      if (!response.ok) continue
      const data = await response.json()
      for (const n of data.news || []) {
        const title = (n.title || '').trim()
        if (!title || seen.has(title)) continue
        const low = title.toLowerCase()
        if (
          low.includes('form 8.3') ||
          low.includes('liquidity contract') ||
          low.includes('stocks under $')
        ) {
          continue
        }
        seen.add(title)
        articles.push({
          title,
          description: n.summary || '',
          url: n.link || `https://finance.yahoo.com/quote/${encodeURIComponent(q)}`,
          source: n.publisher || 'Yahoo Finance',
          publishedAt: n.providerPublishTime
            ? new Date(n.providerPublishTime * 1000).toISOString()
            : new Date().toISOString(),
          related: q,
        })
      }
    } catch (error) {
      console.error('Yahoo news error for', q, error)
    }
  }

  return articles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 20)
}

async function fetchNewsApi(): Promise<NewsArticle[]> {
  const NEWS_API_KEY = process.env.NEWS_API_KEY
  if (!NEWS_API_KEY) return []

  const url = `https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=15&apiKey=${NEWS_API_KEY}`
  const response = await fetch(url, { next: { revalidate: 600 } })
  if (!response.ok) return []

  const data = await response.json()
  const relevantKeywords = [
    'stock',
    'tech',
    'business',
    'finance',
    'investing',
    'crypto',
    'AI',
    'market',
    'trading',
    'nvidia',
    'tesla',
    'bitcoin',
    'fed',
    'semiconductor',
  ]

  return (data.articles || [])
    .filter((article: any) => {
      if (!article.title || !article.url) return false
      const text = `${article.title} ${article.description || ''}`.toLowerCase()
      return relevantKeywords.some((keyword) => text.includes(keyword.toLowerCase()))
    })
    .slice(0, 10)
    .map((article: any) => ({
      title: article.title || 'No title',
      description: article.description || '',
      url: article.url,
      source: article.source?.name || 'Unknown source',
      publishedAt: article.publishedAt || new Date().toISOString(),
      imageUrl: article.urlToImage,
      related: 'MACRO',
    }))
}

export async function GET() {
  try {
    const [yahoo, newsApi] = await Promise.all([fetchYahooNews(), fetchNewsApi()])
    const seen = new Set<string>()
    const articles: NewsArticle[] = []

    for (const article of [...yahoo, ...newsApi]) {
      if (seen.has(article.title)) continue
      seen.add(article.title)
      articles.push(article)
    }

    articles.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    return NextResponse.json({ articles: articles.slice(0, 24), asOf: new Date().toISOString() })
  } catch (error: any) {
    console.error('Error fetching news:', error)
    return NextResponse.json({ articles: [], asOf: new Date().toISOString() })
  }
}
