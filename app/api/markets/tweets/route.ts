import { NextResponse } from 'next/server'

interface Tweet {
  id: string
  text: string
  author: string
  authorHandle: string
  authorAvatar?: string
  timestamp: number
  likes?: number
  retweets?: number
  url: string
  topic?: string
}

interface TweetWithEngagement extends Tweet {
  _engagement: number
}

export async function GET() {
  try {
    const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN
    
    if (!TWITTER_BEARER_TOKEN) {
      // Return empty array if API key not configured
      return NextResponse.json({ tweets: [] })
    }

    // Search for trending tweets about business, tech, or stocks from past 24 hours
    // Focus on high engagement (likes, retweets)
    const query = '(business OR tech OR stocks OR finance OR investing OR startup OR AI OR crypto) -is:retweet lang:en'
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=50&tweet.fields=created_at,public_metrics,author_id,text&expansions=author_id&user.fields=username,name,profile_image_url&sort_order=relevancy`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Twitter API error:', error)
      return NextResponse.json({ tweets: [] })
    }

    const data = await response.json()
    
    // Map users by ID for easy lookup
    const usersMap: Record<string, any> = {}
    if (data.includes?.users) {
      data.includes.users.forEach((user: any) => {
        usersMap[user.id] = user
      })
    }

    // Process tweets and sort by engagement
    const tweetsWithEngagement: TweetWithEngagement[] = (data.data || []).map((tweet: any) => {
      const user = usersMap[tweet.author_id]
      const metrics = tweet.public_metrics || {}
      const engagement = (metrics.like_count || 0) + (metrics.retweet_count || 0) * 2
      
      return {
        id: tweet.id,
        text: tweet.text,
        author: user?.name || 'Unknown',
        authorHandle: user?.username || 'unknown',
        authorAvatar: user?.profile_image_url,
        timestamp: new Date(tweet.created_at).getTime() / 1000,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        url: `https://twitter.com/${user?.username || 'unknown'}/status/${tweet.id}`,
        topic: 'business/tech/stocks',
        _engagement: engagement, // For sorting
      }
    })

    // Sort by engagement and take top 3, then remove the temporary _engagement field
    const topTweets: Tweet[] = tweetsWithEngagement
      .sort((a, b) => b._engagement - a._engagement)
      .slice(0, 3)
      .map(({ _engagement, ...tweet }) => tweet) // Remove temporary field

    return NextResponse.json({ tweets: topTweets })
  } catch (error: any) {
    console.error('Error fetching tweets:', error)
    return NextResponse.json({ tweets: [] })
  }
}
