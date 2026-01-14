# AI Agent Integration Guide

## Overview

The AI Agent is a comprehensive assistant integrated throughout the EliteClub OS that can interact with the entire club management system. Users can:

- Create and manage court reservations
- Add, update, and search for members
- Update club settings
- Retrieve information about members, reservations, and statements
- Get answers to questions about the system

## Features

### 🤖 Intelligent Task Execution
The AI can understand natural language commands and execute actual system operations:
- **Court Reservations**: "Book Court 3 for John Smith tomorrow at 2pm"
- **Member Management**: "Add a new member named Jane Doe with email jane@example.com"
- **Information Retrieval**: "Show me all reservations for next Friday"
- **Settings Management**: "Enable email notifications"

### 💬 Multi-Turn Conversations
The AI asks clarifying questions when information is missing:
- "I'd like to make a reservation" → AI asks: "Which court and what time?"
- "Add a member" → AI asks: "What's their name, email, and membership tier?"

### 🎯 Context-Aware
The AI maintains conversation context and remembers previous interactions within a session.

## Setup Instructions

### 1. Install Dependencies

The OpenAI SDK has been added to `package.json`. Install it:

```bash
cd ClubManagement
npm install
```

### 2. Environment Variables

Create or update your `.env` file in the `ClubManagement` directory:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview  # Optional: defaults to gpt-4-turbo-preview

# Database (existing)
DATABASE_URL=postgresql://postgres:password@localhost:5432/clubmanagement?schema=public
```

### 3. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

**Note**: You'll need to add billing information to your OpenAI account to use the API.

### 4. Run the Application

```bash
npm run dev
```

The AI chat interface will appear as a floating button in the bottom-right corner of every page.

## Usage

### Accessing the AI Assistant

1. Look for the floating chat button (💬) in the bottom-right corner
2. Click to open the chat interface
3. Start typing your request

### Example Commands

#### Court Reservations
```
"Book Court 2 for tomorrow at 3pm for member John Smith"
"Make a reservation for Court 1 on Friday at 10am"
"Show me all court reservations for next week"
```

#### Member Management
```
"Add a new member: Sarah Johnson, email sarah@example.com, FULL_GOLF tier"
"Search for members named Smith"
"Update member John Doe's status to ACTIVE"
"Show me details for member number 2024001"
```

#### Settings
```
"Show me the club settings"
"Enable SMS notifications"
"Update the club phone number to (555) 999-8888"
```

#### Information Queries
```
"What reservations does John Smith have?"
"Show me member statements for member ID abc123"
"What are the current notification settings?"
```

## Architecture

### Components

1. **AI Agent Library** (`lib/ai-agent.ts`)
   - Core AI logic with function calling
   - Tool definitions for system operations
   - Message processing and response generation

2. **Chat API Route** (`app/api/ai/chat/route.ts`)
   - Handles chat requests
   - Processes messages and returns AI responses

3. **Chat UI Component** (`components/ai/ai-chat.tsx`)
   - Floating chat interface
   - Message display and input handling
   - Integrated into main layout

4. **Settings Store** (`lib/settings-store.ts`)
   - Shared settings management
   - Used by both AI agent and settings API

### Available Tools/Functions

The AI agent has access to these system functions:

1. `create_court_reservation` - Create tennis court reservations
2. `search_members` - Search for members by name, email, or number
3. `get_member_details` - Get detailed member information
4. `create_member` - Add new members
5. `update_member` - Update existing members
6. `get_reservations` - Retrieve reservations
7. `get_settings` - Get club settings
8. `update_settings` - Update club settings
9. `get_member_statements` - Get billing statements

## Security

- All AI operations require authentication (session check)
- User context is passed to the AI for personalized responses
- Tool execution validates inputs and handles errors gracefully

## Customization

### Adding New Tools

To add new capabilities to the AI agent:

1. Add a new tool definition to `agentTools` array in `lib/ai-agent.ts`
2. Add a case in the `executeTool` function to handle the new tool
3. Update the system message to inform the AI about the new capability

Example:
```typescript
{
  name: "cancel_reservation",
  description: "Cancel a court reservation",
  parameters: {
    type: "object",
    properties: {
      reservationId: { type: "string", description: "Reservation ID" },
    },
    required: ["reservationId"],
  },
}
```

### Changing the AI Model

Update the `OPENAI_MODEL` environment variable:
- `gpt-4-turbo-preview` - Best quality, slower, more expensive
- `gpt-3.5-turbo` - Faster, cheaper, good for most tasks

### Styling

The chat interface uses the EliteClub OS design system. Customize colors in `components/ai/ai-chat.tsx`:
- Primary: `#0A192F` (Deep Navy)
- Secondary: `#1B4332` (Forest Green)
- Accent: `#C5A059` (Champagne Gold)

## Troubleshooting

### AI Not Responding
- Check that `OPENAI_API_KEY` is set in `.env`
- Verify your OpenAI account has billing enabled
- Check browser console for errors

### Tool Execution Fails
- Ensure database is running and `DATABASE_URL` is correct
- Check that user is authenticated
- Review server logs for detailed error messages

### Settings Not Updating
- Settings are stored in-memory (shared module)
- In production, move to database for persistence
- Changes persist during server session

## Production Considerations

1. **Database Persistence**: Move settings store to database
2. **Rate Limiting**: Add rate limiting to prevent API abuse
3. **Error Handling**: Enhance error messages for production
4. **Logging**: Add comprehensive logging for AI interactions
5. **Cost Management**: Monitor OpenAI API usage and costs
6. **Caching**: Consider caching common queries to reduce API calls

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Test database connectivity


