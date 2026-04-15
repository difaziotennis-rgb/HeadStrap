import { NextResponse } from 'next/server'

// Teaching focus reminders
const teachingFocuses = [
  {
    focus: "Positive Reinforcement",
    tip: "Catch students doing something right today. Acknowledge small improvements - they compound into big wins.",
    reminder: "Praise effort, not just results"
  },
  {
    focus: "Visual Learning",
    tip: "Show, don't just tell. Demonstrate the movement, then have them mirror it. Visual learners need to see it first.",
    reminder: "Demonstration > Explanation"
  },
  {
    focus: "Patience with Beginners",
    tip: "Remember: every expert was once a beginner. Break complex movements into smaller, manageable steps.",
    reminder: "Progress over perfection"
  },
  {
    focus: "Energy Management",
    tip: "Match your energy to your student's needs. High-energy players need engagement; nervous players need calm reassurance.",
    reminder: "Read the room, adapt your style"
  },
  {
    focus: "Fundamentals First",
    tip: "A strong foundation beats fancy shots. Today, focus on one fundamental: grip, stance, or follow-through.",
    reminder: "Master the basics, the rest follows"
  },
  {
    focus: "Game-Based Learning",
    tip: "Turn drills into mini-games. Competition and fun accelerate learning more than repetitive practice.",
    reminder: "Make it fun, make it stick"
  },
  {
    focus: "Individual Attention",
    tip: "Each student learns differently. Take 30 seconds to give one personalized tip to each student today.",
    reminder: "One size doesn't fit all"
  },
  {
    focus: "Body Language",
    tip: "Your posture and movement teach as much as your words. Model the energy and focus you want to see.",
    reminder: "You are the example"
  },
  {
    focus: "Celebrate Small Wins",
    tip: "Acknowledge the first successful serve, the improved footwork, the better court positioning. Progress is progress.",
    reminder: "Every step forward matters"
  },
  {
    focus: "Question-Based Teaching",
    tip: "Ask 'What do you notice?' instead of telling. Self-discovery creates deeper understanding.",
    reminder: "Guide, don't dictate"
  },
  {
    focus: "Rhythm and Timing",
    tip: "Help students find their rhythm. Use counting, music, or verbal cues to establish timing patterns.",
    reminder: "Timing is everything"
  },
  {
    focus: "Court Awareness",
    tip: "Teach students to read the court - where to stand, where the ball is going, where their opponent is.",
    reminder: "Positioning wins points"
  },
  {
    focus: "Mental Toughness",
    tip: "After mistakes, teach the reset. One bad shot doesn't define the point. Mental resilience is a skill.",
    reminder: "Next point, fresh start"
  },
  {
    focus: "Equipment Check",
    tip: "Quick equipment check: grip size, string tension, shoe fit. Small adjustments can make big differences.",
    reminder: "The right tools matter"
  },
  {
    focus: "Warm-Up Purpose",
    tip: "Use warm-ups to assess today's energy and skill level. Adjust your lesson plan based on what you observe.",
    reminder: "Adapt in real-time"
  },
  {
    focus: "Follow-Through Focus",
    tip: "Today, emphasize follow-through on every shot. A complete swing creates power and control.",
    reminder: "Finish the motion"
  },
  {
    focus: "Footwork Foundation",
    tip: "Great shots start with great footwork. Spend extra time on split steps, recovery, and court coverage.",
    reminder: "Feet first, then hands"
  },
  {
    focus: "Communication",
    tip: "Use clear, simple cues. 'Step into the ball' beats 'Transfer your weight forward while maintaining balance.'",
    reminder: "Simple is powerful"
  },
  {
    focus: "Confidence Building",
    tip: "Create opportunities for success. Set up drills where students can succeed, then gradually increase difficulty.",
    reminder: "Success breeds confidence"
  },
  {
    focus: "Rest and Recovery",
    tip: "Teach students to recognize fatigue. Proper rest between drills prevents injury and improves learning.",
    reminder: "Recovery is part of training"
  },
  {
    focus: "Serve Mechanics",
    tip: "Break the serve into checkpoints: toss, trophy position, contact point, follow-through. Master one today.",
    reminder: "Serve is a sequence"
  },
  {
    focus: "Net Play",
    tip: "Volley confidence comes from positioning. Teach them to move forward, not just stand at the net.",
    reminder: "Attack the net"
  },
  {
    focus: "Backhand Development",
    tip: "Whether one-handed or two, the key is rotation. Help students feel the core engagement in their backhand.",
    reminder: "Power comes from rotation"
  },
  {
    focus: "Return of Serve",
    tip: "Teach anticipation and early preparation. The return starts before the serve is hit.",
    reminder: "React before the ball arrives"
  },
  {
    focus: "Lob and Overhead",
    tip: "Practice the defensive lob and offensive overhead together. They're two sides of the same strategy.",
    reminder: "Defense becomes offense"
  },
  {
    focus: "Point Construction",
    tip: "Teach students to build points: set up the shot, execute, and finish. Strategy matters as much as skill.",
    reminder: "Think ahead"
  },
  {
    focus: "Match Play Prep",
    tip: "Simulate match situations in practice. Pressure practice prepares for real competition.",
    reminder: "Practice like you play"
  },
  {
    focus: "Injury Prevention",
    tip: "Emphasize proper warm-up and cool-down. Teach students to listen to their bodies.",
    reminder: "Longevity over intensity"
  }
]

// Daily drills
const dailyDrills = [
  {
    name: "Cross-Court Rally",
    description: "Players rally cross-court only, focusing on consistency and depth. First to 10 consecutive shots wins.",
    focus: "Consistency, Control",
    level: "All Levels",
    time: "5-10 min",
    equipment: "Balls, Cones (optional)"
  },
  {
    name: "Serve and Return",
    description: "Server practices placement, returner practices early preparation. Rotate after 5 serves.",
    focus: "Serve Accuracy, Return Timing",
    level: "Intermediate+",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Approach Shot Drill",
    description: "Player hits approach shot, moves to net, practices volley. Focus on footwork and positioning.",
    focus: "Net Play, Transition",
    level: "Intermediate+",
    time: "10 min",
    equipment: "Balls, Cones"
  },
  {
    name: "Target Practice",
    description: "Place targets in corners. Players aim for targets, earning points for accuracy.",
    focus: "Precision, Shot Placement",
    level: "All Levels",
    time: "10-15 min",
    equipment: "Balls, Targets/Cones"
  },
  {
    name: "King of the Court",
    description: "One player stays on one side, others rotate in. Winner stays, loser rotates out.",
    focus: "Competition, Pressure Play",
    level: "All Levels",
    time: "15-20 min",
    equipment: "Balls"
  },
  {
    name: "Footwork Ladder",
    description: "Agility ladder drills focusing on quick feet, then transition to hitting balls with proper footwork.",
    focus: "Footwork, Agility",
    level: "All Levels",
    time: "10 min",
    equipment: "Agility Ladder, Balls"
  },
  {
    name: "Drop Shot Challenge",
    description: "Players practice drop shots from baseline. Focus on touch, spin, and placement.",
    focus: "Touch, Finesse",
    level: "Intermediate+",
    time: "10 min",
    equipment: "Balls"
  },
  {
    name: "Backhand Consistency",
    description: "Rally using only backhands. Focus on form, depth, and consistency.",
    focus: "Backhand Technique",
    level: "All Levels",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Volley Volley",
    description: "Both players at net, rapid-fire volleys. Focus on quick reactions and compact swings.",
    focus: "Net Play, Reactions",
    level: "Intermediate+",
    time: "5-10 min",
    equipment: "Balls"
  },
  {
    name: "Serve Placement",
    description: "Practice serving to different zones: wide, body, T. Focus on variety and accuracy.",
    focus: "Serve Strategy",
    level: "Intermediate+",
    time: "10-15 min",
    equipment: "Balls, Court Markers"
  },
  {
    name: "Lob and Smash",
    description: "One player lobs, other practices overhead smash. Rotate roles.",
    focus: "Overhead, Defensive Play",
    level: "Intermediate+",
    time: "10 min",
    equipment: "Balls"
  },
  {
    name: "Point Play Simulation",
    description: "Play out points starting from serve. Focus on point construction and strategy.",
    focus: "Match Play, Strategy",
    level: "All Levels",
    time: "15-20 min",
    equipment: "Balls"
  },
  {
    name: "Two-Ball Rally",
    description: "Coach feeds two balls rapidly. Player must hit both with proper recovery between shots.",
    focus: "Recovery, Quick Reactions",
    level: "Intermediate+",
    time: "10 min",
    equipment: "Balls"
  },
  {
    name: "Cross-Court/Down-the-Line",
    description: "Alternate hitting cross-court then down-the-line. Focus on directional control.",
    focus: "Shot Variety, Control",
    level: "Intermediate+",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Return of Serve Focus",
    description: "Practice returning different serve types: flat, slice, kick. Focus on early preparation.",
    focus: "Return Technique",
    level: "Intermediate+",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Movement and Balance",
    description: "Hit on the move, focusing on maintaining balance and proper form while moving.",
    focus: "Footwork, Balance",
    level: "All Levels",
    time: "10 min",
    equipment: "Balls"
  },
  {
    name: "Short Ball Attack",
    description: "Coach feeds short ball, player practices approach shot and net play.",
    focus: "Transition, Net Play",
    level: "Intermediate+",
    time: "10 min",
    equipment: "Balls"
  },
  {
    name: "Consistency Challenge",
    description: "Rally for as many shots as possible without error. Track personal bests.",
    focus: "Consistency, Mental Focus",
    level: "All Levels",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Spin Variation",
    description: "Practice hitting with topspin, slice, and flat. Focus on spin control and purpose.",
    focus: "Spin Control, Shot Variety",
    level: "Intermediate+",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Defensive to Offensive",
    description: "Start in defensive position, practice turning defense into offense with smart shot selection.",
    focus: "Strategy, Shot Selection",
    level: "Intermediate+",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Quick Hands",
    description: "Rapid-fire feeding from close range. Player practices quick reactions and compact swings.",
    focus: "Reactions, Compact Swings",
    level: "All Levels",
    time: "5-10 min",
    equipment: "Balls"
  },
  {
    name: "Serve +1",
    description: "Practice serve followed by first shot. Focus on serve placement and follow-up strategy.",
    focus: "Serve Strategy, Point Building",
    level: "Intermediate+",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Baseline to Net",
    description: "Rally from baseline, then practice moving forward to finish point at net.",
    focus: "Court Movement, Finishing",
    level: "Intermediate+",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Angle Creation",
    description: "Practice creating angles with cross-court shots. Focus on court geometry and placement.",
    focus: "Shot Placement, Strategy",
    level: "Intermediate+",
    time: "10-15 min",
    equipment: "Balls"
  },
  {
    name: "Mental Reset",
    description: "After each mistake, practice the reset routine: breathe, refocus, next point.",
    focus: "Mental Game, Resilience",
    level: "All Levels",
    time: "10 min",
    equipment: "Balls"
  },
  {
    name: "Warm-Up Rally",
    description: "Gentle rally focusing on rhythm and timing. Perfect for lesson start or cool-down.",
    focus: "Rhythm, Warm-Up",
    level: "All Levels",
    time: "5-10 min",
    equipment: "Balls"
  }
]

export async function GET() {
  try {
    // Get day of year (1-365) to ensure same tip/drill for the day
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    // Select based on day of year for consistency
    const teachingFocus = teachingFocuses[dayOfYear % teachingFocuses.length]
    const dailyDrill = dailyDrills[dayOfYear % dailyDrills.length]
    
    return NextResponse.json({
      teachingFocus,
      dailyDrill,
      date: now.toISOString().split('T')[0]
    })
  } catch (error: any) {
    console.error('Error fetching tennis pro tip:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tennis pro tip' },
      { status: 500 }
    )
  }
}
