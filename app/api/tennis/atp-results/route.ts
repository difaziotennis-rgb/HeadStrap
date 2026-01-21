import { NextResponse } from 'next/server'

interface ATPResult {
  tournament: string
  round: string
  winner: string
  loser: string
  score: string
  date: string
  significance?: string
  url?: string
}

// Parse RSS feed XML
function parseRSSFeed(xmlText: string): ATPResult[] {
  const results: ATPResult[] = []
  
  try {
    // Extract items from RSS feed
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
    const items = xmlText.match(itemRegex) || []
    
    for (const item of items.slice(0, 10)) { // Check first 10 items
      // Extract title
      const titleMatch = item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i)
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : ''
      
      // Extract description
      const descMatch = item.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i)
      const description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : ''
      
      // Extract link
      const linkMatch = item.match(/<link[^>]*>(.*?)<\/link>/i)
      const link = linkMatch ? linkMatch[1].trim() : ''
      
      // Extract pubDate
      const dateMatch = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)
      const pubDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString()
      
      // Look for ATP match results in title or description
      const text = `${title} ${description}`.toLowerCase()
      
      // Check if it's about ATP results
      if (text.includes('atp') || text.includes('tennis') && (text.includes('defeats') || text.includes('beats') || text.includes('wins') || text.includes('final') || text.includes('semifinal'))) {
        // Try to extract match information
        const matchInfo = extractMatchInfo(title, description)
        if (matchInfo) {
          results.push({
            ...matchInfo,
            date: parseDate(pubDate),
            url: link,
          })
        }
      }
    }
  } catch (error) {
    console.error('Error parsing RSS feed:', error)
  }
  
  return results
}

// Extract match information from text
function extractMatchInfo(title: string, description: string): ATPResult | null {
  const text = `${title} ${description}`
  
  // Patterns to match ATP results
  // Example: "Djokovic defeats Nadal 6-4, 7-6(5) in ATP Masters final"
  const patterns = [
    // Pattern 1: "Player1 defeats Player2 Score in Tournament Round"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:defeats?|beats?|wins?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([\d\-,\s\(\)]+)\s+(?:in|at|to win)\s+([^,]+?)(?:\s+(final|semifinal|quarterfinal|round of \d+))?/i,
    // Pattern 2: "Tournament: Player1 def. Player2 Score"
    /([^:]+):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:def\.?|defeats?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([\d\-,\s\(\)]+)/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const tournament = match[4] || match[1] || 'ATP Tournament'
      const winner = match[1] || match[2] || ''
      const loser = match[2] || match[3] || ''
      const score = match[3] || match[4] || ''
      const round = extractRound(text)
      
      if (winner && loser && score) {
        return {
          tournament: cleanText(tournament),
          round: round || 'Match',
          winner: cleanText(winner),
          loser: cleanText(loser),
          score: cleanText(score),
          date: new Date().toISOString().split('T')[0],
          significance: determineSignificance(tournament, round),
        }
      }
    }
  }
  
  return null
}

function extractRound(text: string): string {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('final')) return 'Final'
  if (lowerText.includes('semifinal') || lowerText.includes('semi-final')) return 'Semifinal'
  if (lowerText.includes('quarterfinal') || lowerText.includes('quarter-final')) return 'Quarterfinal'
  if (lowerText.includes('round of 16')) return 'Round of 16'
  if (lowerText.includes('round of 32')) return 'Round of 32'
  return 'Match'
}

function determineSignificance(tournament: string, round: string): string {
  const lowerTournament = tournament.toLowerCase()
  const lowerRound = round.toLowerCase()
  
  if (lowerRound.includes('final')) {
    if (lowerTournament.includes('masters') || lowerTournament.includes('1000')) {
      return 'Masters 1000 Final'
    }
    if (lowerTournament.includes('grand slam') || lowerTournament.includes('wimbledon') || lowerTournament.includes('us open') || lowerTournament.includes('french open') || lowerTournament.includes('australian open')) {
      return 'Grand Slam Final'
    }
    return 'Tournament Final'
  }
  if (lowerRound.includes('semifinal')) {
    return 'Semifinal'
  }
  return 'Noteworthy match'
}

function cleanText(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
}

function parseDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

// Scrape tennis news website
async function scrapeTennisNews(): Promise<ATPResult[]> {
  const results: ATPResult[] = []
  
  try {
    // Try ESPN tennis results page
    const response = await fetch('https://www.espn.com/tennis/results', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 3600 }
    })

    if (response.ok) {
      const html = await response.text()
      
      // Look for match results in the HTML
      // ESPN typically has results in a structured format
      const matchPatterns = [
        // Look for score patterns like "6-4, 7-6(5)"
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+def\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([\d\-,\s\(\)]+)/gi,
      ]
      
      for (const pattern of matchPatterns) {
        let match
        while ((match = pattern.exec(html)) !== null && results.length < 5) {
          const winner = cleanText(match[1])
          const loser = cleanText(match[2])
          const score = cleanText(match[3])
          
          // Try to find tournament context nearby
          const contextStart = Math.max(0, match.index - 200)
          const contextEnd = Math.min(html.length, match.index + 200)
          const context = html.substring(contextStart, contextEnd)
          
          const tournament = extractTournamentFromContext(context) || 'ATP Tournament'
          const round = extractRound(context)
          
          if (winner && loser && score) {
            results.push({
              tournament,
              round,
              winner,
              loser,
              score,
              date: new Date().toISOString().split('T')[0],
              significance: determineSignificance(tournament, round),
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scraping tennis news:', error)
  }
  
  return results
}

function extractTournamentFromContext(context: string): string | null {
  // Look for tournament names in context
  const tournamentPatterns = [
    /(ATP\s+(?:Masters\s+)?\d+)/i,
    /(ATP\s+[A-Z][a-z]+)/i,
    /([A-Z][a-z]+\s+Open)/i,
    /([A-Z][a-z]+\s+Masters)/i,
  ]
  
  for (const pattern of tournamentPatterns) {
    const match = context.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

export async function GET() {
  try {
    let results: ATPResult[] = []
    
    // Strategy 1: Try RSS feeds from tennis news sources
    const rssFeeds = [
      'https://www.espn.com/espn/rss/tennis/news',
      'https://feeds.bbci.co.uk/sport/tennis/rss.xml',
      'https://www.theguardian.com/sport/tennis/rss',
    ]
    
    for (const feedUrl of rssFeeds) {
      try {
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml',
          },
          next: { revalidate: 1800 } // Cache for 30 minutes
        })
        
        if (response.ok) {
          const xmlText = await response.text()
          const feedResults = parseRSSFeed(xmlText)
          results.push(...feedResults)
          
          if (results.length >= 2) break // Got enough results
        }
      } catch (error) {
        console.error(`Error fetching RSS feed ${feedUrl}:`, error)
      }
    }
    
    // Strategy 2: If RSS didn't yield enough results, try web scraping
    if (results.length < 2) {
      const scrapedResults = await scrapeTennisNews()
      results.push(...scrapedResults)
    }
    
    // If still no results, return empty array (or could add fallback mock data)
    if (results.length === 0) {
      console.log('No ATP results found from RSS feeds or scraping')
      return NextResponse.json({ results: [] })
    }
    
    // Remove duplicates and sort by recency
    const uniqueResults = results.filter((result, index, self) =>
      index === self.findIndex(r => 
        r.winner === result.winner && 
        r.loser === result.loser && 
        r.tournament === result.tournament
      )
    )
    
    // Sort by date (most recent first) and take top 2
    const sortedResults = uniqueResults
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })
      .slice(0, 2)

    return NextResponse.json({ results: sortedResults }, {
      headers: {
        'Cache-Control': 's-maxage=1800, stale-while-revalidate', // 30 minutes
      }
    })
  } catch (error: any) {
    console.error('Error fetching ATP results:', error)
    return NextResponse.json({ results: [] })
  }
}
