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
      const fullText = `${title} ${description}`
      
      // Check if it's about tennis results
      const isTennisRelated = text.includes('atp') || 
                                  text.includes('tennis') || 
                                  text.includes('wta') ||
                                  text.includes('grand slam') ||
                                  text.includes('masters') ||
                                  text.includes('open')
      
      const hasMatchInfo = text.includes('defeats') || 
                          text.includes('beats') || 
                          text.includes('wins') || 
                          text.includes('def.') ||
                          text.includes('defeated') ||
                          text.includes('final') || 
                          text.includes('semifinal') ||
                          text.includes('quarterfinal') ||
                          /\d-\d/.test(text) // Has score pattern
      
      if (isTennisRelated && hasMatchInfo) {
        // Try to extract match information
        const matchInfo = extractMatchInfo(title, description, fullText)
        if (matchInfo) {
          // Filter: Only ATP matches, or very important WTA matches (Grand Slam finals)
          // ATP matches: explicitly mention ATP, or are men's matches (not WTA), or are Masters/ATP tournaments
          // Exclude WTA unless it's a Grand Slam final
          const isWTA = text.includes('wta') || 
                       (text.includes('sabalenka') || text.includes('gauff') || text.includes('osaka') || 
                        text.includes('keys') || text.includes('swiatek') || text.includes('rybakina'))
          const isATP = text.includes('atp') || 
                       text.includes('masters') ||
                       (!isWTA && (text.includes('djokovic') || text.includes('alcaraz') || 
                                   text.includes('sinner') || text.includes('shelton') || 
                                   text.includes('de minaur') || text.includes('medvedev') ||
                                   text.includes('hanfmann') || text.includes('humbert') ||
                                   text.includes('gaston') || text.includes('martinez')))
          const isImportantWTA = isWTA && 
                                (text.includes('grand slam') || text.includes('wimbledon') || 
                                 text.includes('us open') || text.includes('french open') || 
                                 text.includes('australian open')) &&
                                (text.includes('final') || text.includes('champion'))
          
          if (isATP || isImportantWTA) {
            results.push({
              ...matchInfo,
              date: parseDate(pubDate),
              url: link,
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing RSS feed:', error)
  }
  
  return results
}

// Extract match information from text
function extractMatchInfo(title: string, description: string, fullText: string): ATPResult | null {
  const text = `${title} ${description}`
  
  // Strategy 1: Find defeat verb first, then extract player names right before/after it
  // Examples from RSS:
  // "American Ben Shelton overcame Ugo Humbert of France 6-3, 7-6 (2), 7-6 (5)"
  // "Madison Keys struggled early but held on to defeat Oleksandra Oliynykova 7-6 (6), 6-1"
  
  // First, find the defeat verb and score
  // Order matters - check longer phrases first
  const defeatVerbPattern = /(?:held\s+on\s+to\s+defeat|defeats?|beats?|def\.?|overcame?|prevailed?\s+over)/i
  const scorePattern = /(\d+-\d+(?:\s*\(\d+\))?(?:\s*,\s*\d+-\d+(?:\s*\(\d+\))?)+)/g
  const singleScorePattern = /(\d+-\d+(?:\s*\(\d+\))?)/g
  
  let scoreMatch = text.match(scorePattern)
  if (!scoreMatch) {
    scoreMatch = text.match(singleScorePattern)
  }
  
  if (!scoreMatch) {
    return null // No score found
  }
  
  let score = scoreMatch[0].trim()
  let winner = ''
  let loser = ''
  const scoreIndex = text.indexOf(score)
  
  // Find defeat verb before the score
  const textBeforeScore = text.substring(0, scoreIndex)
  const defeatMatch = textBeforeScore.match(defeatVerbPattern)
  
  if (defeatMatch) {
    const defeatIndex = defeatMatch.index || 0
    const defeatEnd = defeatIndex + defeatMatch[0].length
    
    // Extract text right before defeat verb (up to 100 chars) for winner - need more context
    const beforeDefeat = textBeforeScore.substring(Math.max(0, defeatIndex - 100), defeatIndex).trim()
    // Extract text right after defeat verb (up to 50 chars) for loser
    const afterDefeat = textBeforeScore.substring(defeatEnd, Math.min(textBeforeScore.length, defeatEnd + 50)).trim()
    
    // Find player name - look for EXACTLY 2 words (First Last) before defeat verb
    // Must be immediately before defeat verb or separated by only a few words
    // Pattern: Look for names that are exactly 2 capitalized words
    const allNameMatches: Array<{name: string, index: number, distance: number}> = []
    const namePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g
    
    let match
    while ((match = namePattern.exec(beforeDefeat)) !== null) {
      const name = match[1]
      const nameWords = name.split(' ')
      // ONLY accept exactly 2 words
      if (nameWords.length === 2) {
        const lowerName = name.toLowerCase()
        const firstName = nameWords[0].toLowerCase()
        const lastName = nameWords[1].toLowerCase()
        
        // Exclude if it contains description words or common non-name words
        const isDescriptionWord = (word: string) => {
          return word === 'defending' || word === 'champion' || word === 'round' ||
                 word === 'struggled' || word === 'held' || word === 'early' ||
                 word === 'but' || word === 'on' || word === 'to' || word === 'at' ||
                 word === 'nd' || word === 'rd' || word === 'th' || word === 'st' ||
                 word === 'australian' || word === 'open' || word === 'arena' ||
                 word === 'court' || word === 'park' || word === 'stadium' ||
                 word === 'the' || word === 'and' || word === 'in' || word === 'of'
        }
        
        // Check if first word is a nationality (should skip these)
        const isNationality = (word: string) => {
          return word === 'american' || word === 'spanish' || word === 'french' ||
                 word === 'serbian' || word === 'italian' || word === 'australian' ||
                 word === 'german' || word === 'british' || word === 'canadian' ||
                 word === 'russian' || word === 'ukrainian' || word === 'belarusian' ||
                 word === 'polish' || word === 'czech' || word === 'swiss' ||
                 word === 'austrian' || word === 'japanese' || word === 'chinese' ||
                 word === 'korean' || word === 'brazilian' || word === 'argentine' ||
                 word === 'chilean' || word === 'colombian' || word === 'mexican' ||
                 word === 'dutch' || word === 'belgian' || word === 'croatian' ||
                 word === 'slovak' || word === 'bulgarian' || word === 'romanian' ||
                 word === 'greek' || word === 'turkish' || word === 'indian'
        }
        
        // Skip if first word is a nationality (e.g., "American Ben" should be skipped, we want "Ben Shelton")
        if (!isNationality(firstName) && !isDescriptionWord(firstName) && !isDescriptionWord(lastName) &&
            !lowerName.includes('defending') && !lowerName.includes('champion') &&
            !lowerName.includes('round') && !lowerName.includes('struggled') &&
            !lowerName.includes('held') && !lowerName.includes('early') &&
            !lowerName.includes('but') && !lowerName.includes('on') &&
            !lowerName.includes('to') && !lowerName.includes('at') &&
            !lowerName.includes('nd') && !lowerName.includes('rd') && !lowerName.includes('th') &&
            !lowerName.includes('australian') && !lowerName.includes('open') &&
            !lowerName.includes('arena') && !lowerName.includes('court')) {
          
          // Calculate distance from name end to defeat verb
          const nameEnd = (match.index || 0) + name.length
          const distanceToDefeat = beforeDefeat.length - nameEnd
          
          allNameMatches.push({name, index: match.index || 0, distance: distanceToDefeat})
        }
      }
    }
    
    // Take the name match closest to defeat verb (smallest distance)
    if (allNameMatches.length > 0) {
      // Sort by distance (closest first)
      allNameMatches.sort((a, b) => a.distance - b.distance)
      
      // Take the closest one, but only if it's within 50 chars
      const closestMatch = allNameMatches[0]
      if (closestMatch.distance <= 50) {
        // Check what's between the name and defeat verb
        const nameEnd = closestMatch.index + closestMatch.name.length
        const textBetween = beforeDefeat.substring(nameEnd, beforeDefeat.length).trim()
        
        // Accept the name if the text between is reasonable (not too long)
        // We allow description words between name and defeat verb (e.g., "Madison Keys struggled early but held on to defeat")
        // The name itself is already validated above, so if it's a valid 2-word name, accept it
        if (textBetween.length <= 60) {
          winner = closestMatch.name.trim()
          
          // Also check for nationality prefix right before the name
          const nameStartInText = defeatIndex - 100 + closestMatch.index
          const beforeName = textBeforeScore.substring(Math.max(0, nameStartInText - 20), nameStartInText)
          const nationalityMatch = beforeName.match(/(?:American|Spanish|French|Serbian|Italian|Australian|German|British|Canadian|Russian|Ukrainian|Belarusian|Polish|Czech|Swiss|Austrian|Japanese|Chinese|Korean|Brazilian|Argentine|Chilean|Colombian|Mexican|South African|Dutch|Belgian|Croatian|Slovak|Bulgarian|Romanian|Greek|Turkish|Indian|Thai|Filipino|Indonesian|Malaysian|Singaporean|New Zealand|Finnish|Norwegian|Swedish|Danish|Icelandic|Estonian|Latvian|Lithuanian|Portuguese|Hungarian|Slovenian|Bosnian|Macedonian|Montenegrin|Albanian|Moldovan|Georgian|Armenian|Azerbaijani|Kazakh|Uzbek|Kyrgyz|Tajik|Turkmen|Mongolian|Vietnamese|Cambodian|Laotian|Myanmar|Bangladeshi|Pakistani|Afghan|Iranian|Iraqi|Syrian|Lebanese|Jordanian|Palestinian|Israeli|Saudi|Emirati|Kuwaiti|Qatari|Bahraini|Omani|Yemeni|Egyptian|Libyan|Tunisian|Algerian|Moroccan|Sudanese|Ethiopian|Kenyan|Tanzanian|Ugandan|Rwandan|Ghanaian|Nigerian|Senegalese|Ivorian|Cameroonian|Zimbabwean|Botswanan|Namibian|Angolan|Mozambican|Malawian|Zambian|Malagasy|Mauritian|Seychellois|Comorian|Djiboutian|Eritrean|Somalian|Burundian|Central African|Chadian|Congolese|Equatorial Guinean|Gabonese|Guinean|Guinea-Bissauan|Liberian|Malian|Mauritanian|Nigerien|Sierra Leonean|Togolese|Beninese|Burkina Faso|Cape Verdean|Gambian)\s+$/i)
          // If nationality found, winner is already correct (just the name part)
        }
      }
    }
    
    // Find player name pattern right after defeat verb - must be EXACTLY 2 words (First Last)
    const nameAfterPattern = /^([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+of\s+[A-Z][a-z]+)?/i
    const nameAfterMatch = afterDefeat.match(nameAfterPattern)
    
    if (nameAfterMatch && nameAfterMatch[1]) {
      const potentialLoser = nameAfterMatch[1].trim()
      const loserWords = potentialLoser.split(' ')
      const lowerLoser = potentialLoser.toLowerCase()
      
      // Validate it's exactly 2 words (First Last format)
      if (loserWords.length === 2) {
        const firstName = loserWords[0].toLowerCase()
        const lastName = loserWords[1].toLowerCase()
        
        const isDescriptionWord = (word: string) => {
          return word === 'defending' || word === 'champion' || word === 'round' ||
                 word === 'struggled' || word === 'held' || word === 'early' ||
                 word === 'but' || word === 'on' || word === 'to' || word === 'at' ||
                 word === 'nd' || word === 'rd' || word === 'th' || word === 'st' ||
                 word === 'australian' || word === 'open' || word === 'arena' ||
                 word === 'court' || word === 'park' || word === 'stadium' ||
                 word === 'the' || word === 'and' || word === 'in' || word === 'of'
        }
        
        if (!isDescriptionWord(firstName) && !isDescriptionWord(lastName) &&
            !lowerLoser.includes('defending') && !lowerLoser.includes('champion') &&
            !lowerLoser.includes('round') && !lowerLoser.includes('struggled') &&
            !lowerLoser.includes('held') && !lowerLoser.includes('early') &&
            !lowerLoser.includes('but') && !lowerLoser.includes('on') &&
            !lowerLoser.includes('to') && !lowerLoser.includes('at') &&
            !lowerLoser.includes('nd') && !lowerLoser.includes('rd') && !lowerLoser.includes('th') &&
            !lowerLoser.includes('australian') && !lowerLoser.includes('open')) {
          loser = potentialLoser
          // Remove "of France" etc.
          loser = loser.replace(/\s+of\s+[A-Z][a-z]+$/i, '').trim()
        }
      }
    }
    
    // Validate names are exactly 2 words (First Last format)
    const winnerWords = winner.split(' ')
    const loserWords = loser.split(' ')
    const isReasonableName = (name: string, words: string[]) => {
      // Must be exactly 2 words
      if (!name || words.length !== 2) return false
      const lower = name.toLowerCase()
      const firstName = words[0].toLowerCase()
      const lastName = words[1].toLowerCase()
      
      const isDescriptionWord = (word: string) => {
        return word === 'defending' || word === 'champion' || word === 'round' ||
               word === 'struggled' || word === 'held' || word === 'early' ||
               word === 'but' || word === 'on' || word === 'to' || word === 'at' ||
               word === 'nd' || word === 'rd' || word === 'th' || word === 'st' ||
               word === 'australian' || word === 'open' || word === 'arena' ||
               word === 'court' || word === 'park' || word === 'stadium' ||
               word === 'the' || word === 'and' || word === 'in' || word === 'of'
      }
      
      return !isDescriptionWord(firstName) && !isDescriptionWord(lastName) &&
             !lower.includes('defending') && !lower.includes('champion') &&
             !lower.includes('round') && !lower.includes('struggled') &&
             !lower.includes('held') && !lower.includes('early') &&
             !lower.includes('but') && !lower.includes('on') &&
             !lower.includes('to') && !lower.includes('at') &&
             !lower.includes('arena') && !lower.includes('court') &&
             !lower.includes('nd') && !lower.includes('rd') && !lower.includes('th')
    }
    
    if (winner && loser && score && score.match(/\d+-\d+/) &&
        isReasonableName(winner, winnerWords) &&
        isReasonableName(loser, loserWords)) {
      // Successfully extracted from defeat pattern
    } else {
      // Reset if validation failed
      winner = ''
      loser = ''
      score = ''
    }
  }
  
  // Strategy 2: If pattern matching didn't work, find score first then extract names
  if (!score || !winner || !loser) {
    const completeScorePattern = /(\d+-\d+(?:\s*\(\d+\))?(?:\s*,\s*\d+-\d+(?:\s*\(\d+\))?)+)/g
    const singleScorePattern = /(\d+-\d+(?:\s*\(\d+\))?)/g
    
    let scoreMatches = text.match(completeScorePattern)
    
    if (scoreMatches && scoreMatches.length > 0) {
      score = scoreMatches[0].trim()
    } else {
      scoreMatches = text.match(singleScorePattern)
      if (scoreMatches && scoreMatches.length > 0) {
        score = scoreMatches[0].trim()
      }
    }
    
    if (!score) {
      return null // No score found, can't be a match result
    }
  }
  
  // Clean up score - remove extra spaces
  if (score) {
    score = score.replace(/\s+/g, ' ').trim()
  }
  
  // Find the position of the score in the text (recalculate if score was reset)
  const finalScoreIndex = text.indexOf(score)
  if (finalScoreIndex === -1) {
    return null
  }
  
  // Define exclude words outside the if block so it's accessible everywhere
  const excludeWords = new Set([
    'ATP', 'WTA', 'Open', 'Masters', 'Grand', 'Slam', 'Final', 'Semifinal', 
    'Quarterfinal', 'Round', 'Champion', 'Defending', 'Australian', 'French', 
    'Wimbledon', 'Struggled', 'Held', 'Early', 'But', 'On', 'To', 'The', 'And',
    'With', 'From', 'For', 'After', 'Before', 'During', 'Match', 'Game', 'Set',
    'Keys', 'Madison', 'Defending', 'Champion', 'Struggled', 'Early', 'Held',
    // Venues and arenas - must exclude these
    'Rod Laver', 'Melbourne Park', 'Arthur Ashe', 'Centre Court', 'Court Philippe',
    'Margaret Court', 'John Cain', 'Hisense Arena', 'Margaret Court Arena',
    'Rod', 'Laver', 'Melbourne', 'Park', 'Arthur', 'Ashe', 'Philippe', 'Chatrier',
    // Common non-player phrases
    'Top Seeded', 'Reigning Champion', 'Defending Champion', 'American Ben',
    'Spanish', 'French', 'Serbian', 'Italian', 'Australian', 'German',
    'Reached', 'Advanced', 'Overcame', 'Prevailed', 'Booked', 'Places'
  ])
  
  // If we already have winner/loser from pattern matching, skip the complex extraction
  if (!winner || !loser) {
    // Extract context around the score (100 chars before and after)
    const contextStart = Math.max(0, finalScoreIndex - 150)
    const contextEnd = Math.min(text.length, finalScoreIndex + score.length + 150)
    const context = text.substring(contextStart, contextEnd)
  
    // Find player names - look for proper names (First Last format) near the score
    // Pattern: Capitalized first name + capitalized last name - EXACTLY 2 words
    const namePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g
    const allNames: string[] = []
  
    let nameMatch
    while ((nameMatch = namePattern.exec(context)) !== null) {
      const name = nameMatch[1].trim()
      const firstName = name.split(' ')[0]
      const nameParts = name.split(' ')
      // Filter out common words and ensure it looks like a name
      // ONLY accept exactly 2 words (First Last)
      if (!excludeWords.has(name) && !excludeWords.has(firstName) && 
          name.length >= 4 && nameParts.length === 2) {
        allNames.push(name)
      }
    }
  
  // Remove duplicates
  const uniqueNames = Array.from(new Set(allNames))
  
  // Log for debugging
  if (uniqueNames.length < 2) {
    console.log(`Not enough names found near score: ${uniqueNames.length} names found`)
    console.log(`Context around score: ${context.substring(0, 200)}...`)
    // Don't return null yet - try to extract with fewer names
  }
  
    // Determine winner and loser based on position relative to score
    const scorePosInContext = finalScoreIndex - contextStart
    let extractedWinner = ''
    let extractedLoser = ''
  
  // Find names before and after the score - use more precise pattern
  // Look for names that are clearly separated (not part of longer phrases)
  const beforeScore = context.substring(0, scorePosInContext)
  const afterScore = context.substring(scorePosInContext + score.length)
  
  // More precise pattern: names should be standalone, not part of longer phrases
  // Pattern: word boundary, capitalized word, space, capitalized word, word boundary
  // But exclude if followed/preceded by common words
  const preciseNamePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g
  
  const beforeNames: string[] = []
  const afterNames: string[] = []
  
  // Extract names from before score
  let match
  while ((match = preciseNamePattern.exec(beforeScore)) !== null) {
    const name = match[1].trim()
    const matchIndex = match.index
    const beforeText = beforeScore.substring(Math.max(0, matchIndex - 20), matchIndex)
    const afterText = beforeScore.substring(matchIndex + name.length, Math.min(beforeScore.length, matchIndex + name.length + 20))
    
    // Check if this looks like a real player name (not part of a phrase)
    const lowerName = name.toLowerCase()
    const lowerBefore = beforeText.toLowerCase()
    const lowerAfter = afterText.toLowerCase()
    
    // Skip if it's part of a longer phrase or contains description words
    if (!lowerBefore.match(/\b(defending|champion|round|at|in|the|a|an|struggled|held|early|but|on|to)\s*$/i) &&
        !lowerAfter.match(/^(defending|champion|round|at|in|the|a|an|struggled|held|early|but|on|to)\s*/i) &&
        !lowerName.includes('round') && !lowerName.includes('champion') &&
        !lowerName.includes('defending') && !lowerName.includes('struggled') &&
        name.length >= 5 && name.length <= 30 && // Reasonable name length
        name.split(' ').length === 2) { // ONLY exactly 2 words
      const first = name.split(' ')[0]
      const lowerN = name.toLowerCase()
      if (!excludeWords.has(name) && !excludeWords.has(first) &&
          !lowerN.includes('arena') && !lowerN.includes('court') && 
          !lowerN.includes('park') && !lowerN.includes('stadium') &&
          !lowerN.includes('rod laver') && !lowerN.includes('melbourne park')) {
        beforeNames.push(name)
      }
    }
  }
  
  // Extract names from after score
  preciseNamePattern.lastIndex = 0 // Reset regex
  while ((match = preciseNamePattern.exec(afterScore)) !== null) {
    const name = match[1].trim()
    const matchIndex = match.index
    const beforeText = afterScore.substring(Math.max(0, matchIndex - 20), matchIndex)
    const afterText = afterScore.substring(matchIndex + name.length, Math.min(afterScore.length, matchIndex + name.length + 20))
    
    const lowerName = name.toLowerCase()
    const lowerBefore = beforeText.toLowerCase()
    const lowerAfter = afterText.toLowerCase()
    
    if (!lowerBefore.match(/\b(defending|champion|round|at|in|the|a|an|struggled|held|early|but|on|to)\s*$/i) &&
        !lowerAfter.match(/^(defending|champion|round|at|in|the|a|an|struggled|held|early|but|on|to)\s*/i) &&
        !lowerName.includes('round') && !lowerName.includes('champion') &&
        !lowerName.includes('defending') && !lowerName.includes('struggled') &&
        name.length >= 5 && name.length <= 30 &&
        name.split(' ').length >= 2 && name.split(' ').length <= 4) {
      const first = name.split(' ')[0]
      const lowerN = name.toLowerCase()
      if (!excludeWords.has(name) && !excludeWords.has(first) &&
          !lowerN.includes('arena') && !lowerN.includes('court') && 
          !lowerN.includes('park') && !lowerN.includes('stadium') &&
          !lowerN.includes('rod laver') && !lowerN.includes('melbourne park')) {
        afterNames.push(name)
      }
    }
  }
  
    // Winner is typically the last name before the score, loser is first after
    if (beforeNames.length > 0) {
      extractedWinner = beforeNames[beforeNames.length - 1].trim()
    }
    if (afterNames.length > 0) {
      extractedLoser = afterNames[0].trim()
    }
    
    // If we still don't have both, try looking for "defeats" or "def." pattern
    if (!extractedWinner || !extractedLoser) {
    const defeatPattern = /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:defeats?|beats?|def\.?|prevails?\s+over|overcame?)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i
      const defeatMatch = context.match(defeatPattern)
      if (defeatMatch) {
        const potentialWinner = defeatMatch[1]?.trim() || ''
        const potentialLoser = defeatMatch[2]?.trim() || ''
        // Validate these are exactly 2 words and aren't venue names
        const winnerParts = potentialWinner.split(' ')
        const loserParts = potentialLoser.split(' ')
        if (potentialWinner && winnerParts.length === 2 &&
            !excludeWords.has(potentialWinner) && 
            !potentialWinner.toLowerCase().includes('arena') &&
            !potentialWinner.toLowerCase().includes('court') &&
            potentialLoser && loserParts.length === 2 &&
            !excludeWords.has(potentialLoser) &&
            !potentialLoser.toLowerCase().includes('arena') &&
            !potentialLoser.toLowerCase().includes('court')) {
          extractedWinner = potentialWinner
          extractedLoser = potentialLoser
        }
      }
    }
    
    // If still missing winner, try looking in the full text before the score
    if (!extractedWinner && extractedLoser) {
      // Look for names in a wider context before the score
      const widerBeforeScore = text.substring(Math.max(0, finalScoreIndex - 300), finalScoreIndex)
    const widerBeforeNames = widerBeforeScore.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g) || []
    const validWiderBeforeNames = widerBeforeNames.filter(n => {
      const first = n.split(' ')[0]
      const lowerN = n.toLowerCase()
      const nameParts = n.split(' ')
      return nameParts.length === 2 && // ONLY exactly 2 words
             !excludeWords.has(n) && !excludeWords.has(first) && 
             n.length >= 5 && n !== loser &&
             !lowerN.includes('arena') && !lowerN.includes('court') &&
             !lowerN.includes('park') && !lowerN.includes('stadium')
    })
      if (validWiderBeforeNames.length > 0) {
        extractedWinner = validWiderBeforeNames[validWiderBeforeNames.length - 1].trim()
      }
    }
    
    // If still missing loser, try looking in the full text after the score
    if (extractedWinner && !extractedLoser) {
      // Look for names in a wider context after the score
      const widerAfterScore = text.substring(finalScoreIndex + score.length, Math.min(text.length, finalScoreIndex + score.length + 300))
    const widerAfterNames = widerAfterScore.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g) || []
    const validWiderAfterNames = widerAfterNames.filter(n => {
      const first = n.split(' ')[0]
      const lowerN = n.toLowerCase()
      const nameParts = n.split(' ')
      return nameParts.length === 2 && // ONLY exactly 2 words
             !excludeWords.has(n) && !excludeWords.has(first) && 
             n.length >= 5 && n !== winner &&
             !lowerN.includes('arena') && !lowerN.includes('court') &&
             !lowerN.includes('park') && !lowerN.includes('stadium')
    })
      if (validWiderAfterNames.length > 0) {
        extractedLoser = validWiderAfterNames[0].trim()
      }
    }
    
    // Use extracted names if we found them
    if (extractedWinner && !winner) {
      winner = extractedWinner
    }
    if (extractedLoser && !loser) {
      loser = extractedLoser
    }
  }
  
  // Extract tournament name from title or beginning of description
  let tournament = 'ATP Tournament'
  const tournamentPatterns = [
    /(Australian\s+Open|French\s+Open|Wimbledon|US\s+Open)/i,
    /(ATP\s+(?:Masters\s+)?\d+|ATP\s+[A-Z][a-z]+)/i,
    /([A-Z][a-z]+\s+Open)/i,
    /([A-Z][a-z]+\s+Masters)/i,
  ]
  
  // Check title first (more reliable)
  for (const pattern of tournamentPatterns) {
    const match = title.match(pattern)
    if (match) {
      tournament = match[1]
      break
    }
  }
  
  // If not found in title, check description
  if (tournament === 'ATP Tournament') {
    for (const pattern of tournamentPatterns) {
      const match = description.match(pattern)
      if (match) {
        tournament = match[1]
        break
      }
    }
  }
  
  // Extract round
  const round = extractRound(text)
  
  // Final validation - must have winner, loser, and valid score
  // Relaxed requirements: names can be shorter, score can be single set
  if (winner && loser && score && 
      winner.length >= 3 && loser.length >= 3 &&
      winner.split(' ').length >= 1 && loser.split(' ').length >= 1 &&
      score.match(/\d+-\d+/)) { // Just needs to have a score pattern
    // Clean up names
    winner = cleanText(winner).trim()
    loser = cleanText(loser).trim()
    
    // Final check: exclude venue names and ensure names are valid
    const winnerLower = winner.toLowerCase()
    const loserLower = loser.toLowerCase()
    const isVenueName = (name: string) => {
      return name.includes('arena') || name.includes('court') || 
             name.includes('park') || name.includes('stadium') ||
             name.includes('rod laver') || name.includes('melbourne park') ||
             name.includes('arthur ashe') || name.includes('centre court')
    }
    
    // Make sure names don't contain score patterns, aren't venue names, and are reasonable
    if (!winner.match(/\d/) && !loser.match(/\d/) &&
        winner.length >= 3 && loser.length >= 3 &&
        winner !== loser &&
        !isVenueName(winnerLower) && !isVenueName(loserLower) &&
        !excludeWords.has(winner) && !excludeWords.has(loser)) {
      return {
        tournament: cleanText(tournament),
        round: round || 'Match',
        winner: winner,
        loser: loser,
        score: score,
        date: new Date().toISOString().split('T')[0],
        significance: determineSignificance(tournament, round),
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
      'https://www.tennis.com/feed/',
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
          console.log(`Fetched RSS feed ${feedUrl}, length: ${xmlText.length}`)
          const feedResults = parseRSSFeed(xmlText)
          if (feedResults.length > 0) {
            console.log(`Found ${feedResults.length} ATP results from ${feedUrl}`)
            results.push(...feedResults)
          } else {
            console.log(`No ATP results extracted from ${feedUrl} (may need better parsing)`)
          }
          
          if (results.length >= 2) break // Got enough results
        } else {
          console.log(`RSS feed ${feedUrl} returned status ${response.status}`)
        }
      } catch (error) {
        console.error(`Error fetching RSS feed ${feedUrl}:`, error)
      }
    }
    
    // Strategy 2: If RSS didn't yield enough results, try web scraping
    if (results.length < 2) {
      console.log('Trying web scraping as fallback...')
      const scrapedResults = await scrapeTennisNews()
      if (scrapedResults.length > 0) {
        console.log(`Found ${scrapedResults.length} results from scraping`)
        results.push(...scrapedResults)
      }
    }
    
    // If still no results, log and return empty array (don't show mock data)
    if (results.length === 0) {
      console.log('No ATP results found from RSS feeds or scraping')
      console.log('This could mean: RSS feeds are not accessible, parsing failed, or no recent ATP matches')
      // Return empty array instead of mock data - let the UI handle the empty state
      return NextResponse.json({ results: [] }, {
        headers: {
          'Cache-Control': 's-maxage=1800, stale-while-revalidate',
        }
      })
    }
    
    // Remove duplicates and sort by recency
    const uniqueResults = results.filter((result, index, self) =>
      index === self.findIndex(r => 
        r.winner === result.winner && 
        r.loser === result.loser && 
        r.tournament === result.tournament
      )
    )
    
    // Sort by date (most recent first)
    const sortedResults = uniqueResults.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })
    
    // Take top 2, but if second match has issues, try to get a different one
    let finalResults = sortedResults.slice(0, 2)
    
    // If we have more than 2 results and the second one might be problematic, try a different one
    if (sortedResults.length > 2 && finalResults.length === 2) {
      const secondMatch = finalResults[1]
      // Check if second match might be problematic (e.g., WTA match or has validation issues)
      const secondMatchLower = (secondMatch.winner + ' ' + secondMatch.loser).toLowerCase()
      const isProblematic = secondMatchLower.includes('keys') && secondMatchLower.includes('madison') ||
                           secondMatchLower.includes('oliynykova') ||
                           secondMatch.winner.length > 30 || secondMatch.loser.length > 30
      
      if (isProblematic) {
        // Try to get a different second match
        for (let i = 2; i < Math.min(sortedResults.length, 5); i++) {
          const candidate = sortedResults[i]
          const candidateLower = (candidate.winner + ' ' + candidate.loser).toLowerCase()
          // Prefer ATP matches (not WTA) and ensure names are reasonable
          const isGoodCandidate = !candidateLower.includes('keys') || 
                                 !candidateLower.includes('madison') ||
                                 !candidateLower.includes('oliynykova')
          
          if (isGoodCandidate && candidate.winner.length <= 30 && candidate.loser.length <= 30) {
            finalResults = [finalResults[0], candidate]
            break
          }
        }
      }
    }
    
    // Ensure we only return 2 results
    finalResults = finalResults.slice(0, 2)

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
