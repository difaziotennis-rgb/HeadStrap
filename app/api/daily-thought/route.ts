import { NextResponse } from 'next/server'

// Curated daily thoughts for reflection and presence
const DAILY_THOUGHTS = [
  "Today, take a moment to breathe deeply and remember that this present moment is all we truly have.",
  "The quality of your life is determined by the quality of your attention. Where is your attention right now?",
  "In the stillness between thoughts, you'll find the peace you've been seeking.",
  "Every breath is a new beginning. Every moment is a fresh opportunity to choose presence over distraction.",
  "The deeper meaning of life isn't found in what you achieve, but in how fully you experience each moment.",
  "When you slow down enough to notice, you'll discover that life itself is the miracle.",
  "Your true self exists beyond the stories your mind tells. Can you feel the silence beneath the noise?",
  "Today, let go of the need to control everything. Trust the flow of life and find peace in acceptance.",
  "The present moment is the only place where life actually happens. Everything else is memory or imagination.",
  "What if the purpose of life is simply to be fully alive, right here, right now?",
  "In the space between stimulus and response lies your freedom. Choose presence.",
  "The answers you seek aren't in the future or past—they're in the depth of this very moment.",
  "When you stop trying to be somewhere else, you discover you're already home.",
  "Life isn't a problem to be solved, but an experience to be lived with full awareness.",
  "The present moment is perfect, not because it's easy, but because it's real.",
  "Your awareness is the light that illuminates everything. Shine it on this moment.",
  "The deeper meaning of life reveals itself when you stop asking 'why' and start experiencing 'what is.'",
  "Today, notice the space between your thoughts. That's where your true nature lives.",
  "Every moment contains the entire universe. Can you feel it?",
  "The purpose of life is to wake up from the dream of separation and remember you are one with all that is.",
  "When you're fully present, you're not trying to get anywhere—you're already there.",
  "The present moment is the teacher. Are you listening?",
  "Life is happening right now, not in your plans or memories. Don't miss it.",
  "In stillness, you'll find the answers that thinking can never provide.",
  "The deeper meaning of life is found in the ordinary moments when you're fully awake to them.",
  "Today, let your awareness rest in the present moment, like a bird landing on a branch.",
  "The mystery of existence isn't something to understand—it's something to experience directly.",
  "When you stop seeking meaning, meaning finds you in the simplicity of being.",
  "The present moment is the only moment that's real. Everything else is a story.",
  "Your true home is not a place, but a state of presence you can access anytime.",
  "Life's deepest questions dissolve when you realize you are the answer.",
  "Today, remember that you are not separate from life—you are life itself, experiencing itself.",
  "The purpose of existence is existence itself. Everything else is commentary.",
  "In the depth of presence, you'll find the love and peace you've been searching for.",
  "The present moment is complete. Nothing needs to be added or taken away.",
  "When you're fully here, you're not trying to become something—you're already everything.",
  "The deeper meaning of life is found in the space between your thoughts.",
  "Today, let go of the need to know everything. Rest in the mystery of not-knowing.",
  "The present moment is the doorway to eternity. Step through.",
  "Life is not a journey to somewhere else. It's a dance happening right now.",
  "In presence, you'll discover that you are both the observer and the observed.",
  "The meaning of life is to be fully alive in this moment, with all your being.",
  "Today, notice that awareness itself is what you've been looking for all along.",
  "The present moment is the only moment where love, peace, and truth can be found.",
  "When you stop trying to escape the present, you'll find it's the only place you want to be.",
  "The deeper meaning of life is not in the answers, but in the questions themselves.",
  "Today, remember that you are the awareness that witnesses all experience.",
  "The present moment is perfect because it's the only moment that exists.",
  "In stillness, you'll find the movement of life. In silence, you'll hear its song.",
  "The purpose of life is to wake up to the miracle that you are, right now.",
  "Today, let your attention rest in the present moment, like a leaf floating on water.",
  "The deeper meaning of life is found when you stop looking and start seeing.",
  "The present moment is your teacher, your friend, your home. Welcome it fully.",
  "When you're fully present, you're not separate from anything—you are everything.",
  "Life's deepest truth is simple: you are here, now, and that's enough.",
  "Today, remember that awareness is the most precious gift you can give yourself.",
  "The present moment contains everything you need. Can you feel it?",
  "In the depth of presence, you'll find that you are both the seeker and what is sought.",
  "The meaning of life is not to be found—it's to be lived, fully, in this moment.",
  "Today, let go of the story of who you think you are and rest in who you actually are.",
  "The present moment is the only moment where transformation is possible.",
  "When you're fully awake to this moment, you'll see that life itself is the miracle.",
  "The deeper meaning of life reveals itself when you stop seeking and start being.",
  "Today, notice that the present moment is the only moment that's real.",
  "The purpose of existence is to exist fully, with complete awareness and presence.",
  "In the space of presence, you'll find the peace that passes all understanding.",
  "The present moment is perfect, not because it's easy, but because it's what is.",
  "Today, remember that you are the awareness that makes all experience possible.",
  "The deeper meaning of life is found in the simplicity of being fully here, now.",
  "When you stop trying to get somewhere, you'll realize you're already there.",
  "The present moment is the only moment where life actually happens.",
  "Today, let your awareness rest in the present moment, like a lake reflecting the sky.",
  "The meaning of life is not in the destination, but in the journey of presence itself.",
  "In stillness, you'll find the movement of life. In presence, you'll find yourself.",
  "The present moment is complete and whole, just as it is.",
  "Today, remember that awareness is the light that illuminates everything.",
  "The deeper meaning of life is found when you stop asking why and start experiencing what is.",
  "The present moment is the only moment where you can truly be free.",
  "When you're fully present, you're not trying to be someone—you're just being.",
  "Life's deepest truth is that you are the awareness that witnesses all experience.",
  "Today, let go of the need to understand everything and rest in the mystery of being.",
  "The present moment is the doorway to the eternal. Step through with full awareness.",
  "The purpose of life is to wake up to the miracle that you are, right here, right now.",
  "In presence, you'll discover that you are both the question and the answer.",
  "The deeper meaning of life reveals itself when you stop seeking and start seeing.",
  "Today, notice that the present moment is the only moment that's real.",
  "The present moment is your teacher, your guide, your home. Welcome it fully.",
  "When you're fully awake to this moment, you'll see that life itself is the gift.",
  "The meaning of life is not to be found—it's to be lived, fully, in this moment.",
  "Today, remember that you are the awareness that makes all experience possible.",
  "The present moment is perfect because it's the only moment that exists.",
  "In the depth of presence, you'll find the love and peace you've been searching for.",
  "The deeper meaning of life is found in the space between your thoughts.",
  "Today, let your attention rest in the present moment, like a bird in flight.",
  "The purpose of existence is to exist fully, with complete awareness and presence.",
  "The present moment is the only moment where transformation is possible.",
  "When you stop trying to escape the present, you'll find it's the only place you want to be.",
]

export async function GET() {
  try {
    // Get day of year (1-365/366) to ensure same thought each day
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)
    
    // Use day of year to select a thought (ensures same thought all day)
    const thoughtIndex = dayOfYear % DAILY_THOUGHTS.length
    const thought = DAILY_THOUGHTS[thoughtIndex]
    
    return NextResponse.json({ 
      thought,
      date: now.toISOString().split('T')[0], // YYYY-MM-DD format
      dayOfYear
    })
  } catch (error: any) {
    console.error('Error fetching daily thought:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch daily thought' },
      { status: 500 }
    )
  }
}
