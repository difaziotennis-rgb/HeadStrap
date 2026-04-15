import { NextResponse } from 'next/server'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

export async function GET() {
  try {
    // Using NewsAPI.org (free tier available)
    // You can get a free API key from https://newsapi.org/
    const NEWS_API_KEY = process.env.NEWS_API_KEY
    
    if (!NEWS_API_KEY) {
      // Return empty array if API key not configured
      return NextResponse.json({ articles: [] })
    }

    // Search for top business/tech/stocks news
    // Free tier allows: business, technology, general categories
    const url = `https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=10&apiKey=${NEWS_API_KEY}`
    
    const response = await fetch(url, {
      next: { revalidate: 600 } // Cache for 10 minutes
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('News API error:', {
        status: response.status,
        statusText: response.statusText,
        error: error
      })
      return NextResponse.json({ articles: [] })
    }

    const data = await response.json()
    
    // Process articles and filter for relevant topics
    const relevantKeywords = ['stock', 'tech', 'business', 'finance', 'investing', 'crypto', 'AI', 'startup', 'market', 'trading']
    
    const articles: NewsArticle[] = (data.articles || [])
      .filter((article: any) => {
        if (!article.title || !article.description || !article.url) return false
        
        const text = `${article.title} ${article.description}`.toLowerCase()
        return relevantKeywords.some(keyword => text.includes(keyword))
      })
      .slice(0, 2) // Get top 2
      .map((article: any) => ({
        title: article.title || 'No title',
        description: article.description || article.content?.substring(0, 150) || 'No description available',
        url: article.url,
        source: article.source?.name || 'Unknown source',
        publishedAt: article.publishedAt || new Date().toISOString(),
        imageUrl: article.urlToImage,
      }))

    return NextResponse.json({ articles })
  } catch (error: any) {
    console.error('Error fetching news:', error)
    return NextResponse.json({ articles: [] })
  }
}
