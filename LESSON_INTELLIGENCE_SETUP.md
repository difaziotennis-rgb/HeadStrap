# Tennis Lesson Intelligence System - Setup Guide

## Overview

A powerful AI-powered system for tennis coaches to record lessons, transcribe audio, and automatically build structured student profiles using:
- **Groq (Whisper)** for near-instant speech-to-text transcription
- **Google Gemini 2.0 Flash** for intelligent parsing and data extraction
- **Supabase** for database storage

## Features

- 🎤 High-quality audio recording with real-time visualizer
- ⚡ Near-instant transcription using Groq's Whisper model
- 🤖 AI-powered parsing to extract structured student data
- 📊 Automatic student profile merging (updates existing profiles intelligently)
- 🎸 Frankenstrat-inspired dark mode UI (red/white/black theme)

## Setup Steps

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Supabase (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Groq API (for transcription)
# Get your key from: https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here

# Google Gemini API (for AI parsing)
# Get your key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Database Setup

Run the SQL schema in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `lesson-intelligence-schema.sql`
4. Click **Run**

This will create:
- `students` table (stores student profiles with JSONB summary data)
- `lessons` table (stores individual lesson transcripts and parsed data)
- Indexes for performance
- Row Level Security policies

### 3. API Keys Setup

#### Groq API Key
1. Sign up at [console.groq.com](https://console.groq.com/)
2. Create an API key
3. Add to `.env.local` as `GROQ_API_KEY`

#### Google Gemini API Key
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add to `.env.local` as `GEMINI_API_KEY`

### 4. Test the System

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/lesson`
3. Click "Start Recording" and speak a lesson summary
4. Click "Stop Recording"
5. Watch as the AI processes and creates/updates the student profile

## How It Works

### Workflow

1. **Record**: Coach records audio using the Web Audio API
2. **Transcribe**: Audio is sent to Groq (Whisper) for transcription
3. **Parse**: Transcript is analyzed by Gemini AI to extract:
   - Student name
   - Key areas focused
   - Physical limitations
   - Future goals
   - Next lesson date
4. **Merge**: If student exists, AI intelligently merges new data with existing profile
5. **Save**: Lesson and updated profile are saved to Supabase

### Student Profile Merging

The system intelligently merges new lesson data with existing profiles:
- **Key Areas**: Combines arrays, removes duplicates
- **Physical Limitations**: Merges and deduplicates
- **Future Goals**: Combines all goals
- **Next Lesson Date**: Updates if new date is provided
- **Student Name**: Preserves existing name if new one is unclear

## UI Theme

The interface features a **Frankenstrat-inspired** design:
- **Dark mode** base (black background)
- **Bold stripes** of Red (#D11919), White (#FFFFFF), and Black (#000000)
- **High-contrast** borders and typography
- **Rock-and-roll** aesthetic while remaining professional

## API Endpoints

- `POST /api/lesson/transcribe` - Transcribe audio using Groq
- `POST /api/lesson/parse` - Parse transcript using Gemini
- `GET /api/lesson/students` - Fetch all students
- `POST /api/lesson/students` - Create new student
- `PUT /api/lesson/students` - Update student profile
- `POST /api/lesson/lessons` - Save lesson record
- `GET /api/lesson/lessons` - Fetch lessons (optionally filtered by student_id)

## Troubleshooting

### "Groq API key not configured"
- Make sure `GROQ_API_KEY` is in your `.env.local` file
- Restart your dev server after adding environment variables

### "Gemini API key not configured"
- Make sure `GEMINI_API_KEY` is in your `.env.local` file
- Restart your dev server after adding environment variables

### "Failed to access microphone"
- Check browser permissions for microphone access
- Make sure you're using HTTPS (or localhost) - browsers block mic access on insecure connections

### Database errors
- Verify Supabase credentials in `.env.local`
- Make sure you've run the SQL schema in Supabase
- Check Row Level Security policies if you're getting permission errors

### Transcription returns empty
- Check that your audio is clear and in English
- Verify Groq API key is valid and has credits
- Check browser console for detailed error messages

## Production Deployment

When deploying to Vercel (or other platforms):

1. Add all environment variables in your deployment platform's settings
2. Make sure Supabase RLS policies allow your application
3. Test the recording functionality (HTTPS is required for microphone access)

## Data Structure

### Student Summary Data (JSONB)
```typescript
{
  student_name: string;
  key_areas_focused: string[];
  physical_limitations: string[];
  future_goals: string[];
  next_lesson_date: string; // YYYY-MM-DD or "not specified"
  last_updated: string; // ISO timestamp
}
```

### Parsed Lesson Data
```typescript
{
  student_name: string;
  key_areas_focused: string[];
  physical_limitations: string[];
  future_goals: string[];
  next_lesson_date: string;
}
```

## Next Steps

- Add lesson history view for each student
- Implement search/filter functionality
- Add export capabilities (PDF, CSV)
- Add audio playback for recorded lessons
- Implement lesson notes editing
