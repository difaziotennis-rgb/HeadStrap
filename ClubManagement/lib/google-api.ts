import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

// Initialize Google OAuth2 client
export function getGoogleAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/google/callback"

  if (!clientId || !clientSecret) {
    throw new Error("Google API credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file.")
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  )
}

// Get Google Calendar API client
export async function getCalendarClient(accessToken: string) {
  const auth = getGoogleAuthClient()
  auth.setCredentials({ access_token: accessToken })

  return google.calendar({ version: "v3", auth })
}

// Get Google Sheets API client
export async function getSheetsClient(accessToken: string) {
  const auth = getGoogleAuthClient()
  auth.setCredentials({ access_token: accessToken })

  return google.sheets({ version: "v4", auth })
}

// Generate Google OAuth URL for authorization
export function getGoogleAuthUrl(scopes: string[] = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/spreadsheets",
]): string {
  const auth = getGoogleAuthClient()
  return auth.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // Force consent screen to get refresh token
  })
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const auth = getGoogleAuthClient()
  const { tokens } = await auth.getToken(code)
  return tokens
}

// Refresh access token if needed
export async function refreshAccessToken(refreshToken: string) {
  const auth = getGoogleAuthClient()
  auth.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await auth.refreshAccessToken()
  return credentials.access_token
}

