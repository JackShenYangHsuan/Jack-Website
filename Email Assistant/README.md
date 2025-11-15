# Gmail Auto-Tagger

An intelligent email labeling system that automatically organizes your Gmail inbox using AI-powered, natural language rules.

## Overview

Gmail Auto-Tagger connects to your Gmail account and applies labels to incoming emails in real-time based on rules you define in plain English. No more manual email sorting - just describe what you want tagged and let AI do the work.

### Key Features

- **AI-Powered Matching**: Uses OpenAI to understand natural language rules like "promotional emails from retailers" or "urgent messages from my manager"
- **Real-Time Processing**: Labels emails within seconds of arrival using Gmail Push Notifications
- **Privacy-First**: Your OpenAI API key stays in your browser - never sent to our servers
- **Priority-Based Rules**: Set priorities to control which label applies when multiple rules match
- **Easy Setup**: Simple web interface for managing rules and connecting your Gmail account

## Architecture

- **Backend**: Node.js/Express API with PostgreSQL database
- **Frontend**: React (Vite) with Tailwind CSS
- **Gmail Integration**: Google OAuth 2.0 + Gmail API + Cloud Pub/Sub
- **AI**: OpenAI API (user-provided API keys)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Cloud Project with Gmail API enabled
- OpenAI API key (for natural language processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Email\ Assistant
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb gmail_auto_tagger

   # Run migrations (to be implemented)
   npm run migrate
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Usage

1. **Connect Gmail**: Click "Sign in with Google" and authorize the app
2. **Add OpenAI API Key**: Enter your OpenAI API key in the settings (stored locally in your browser)
3. **Create Rules**: Define tagging rules in natural language
4. **Set Priorities**: Assign priority levels (1-10) to control rule precedence
5. **Let it run**: New emails are automatically tagged based on your rules

### Example Rules

- "Promotional emails from online stores" → Label: Shopping
- "Urgent messages from john@company.com" → Label: Urgent
- "Newsletters about technology" → Label: Tech News
- "Receipts and invoices" → Label: Finance

## Project Structure

```
Email Assistant/
├── backend/
│   ├── config/          # Database and Gmail API configuration
│   ├── models/          # Database models (User, Rule, TaggingLog)
│   ├── routes/          # API routes (auth, rules, gmail)
│   ├── services/        # Business logic (Gmail, AI matching, email processing)
│   ├── middleware/      # Authentication middleware
│   ├── utils/           # Utility functions (encryption)
│   ├── server.js        # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components (Login, Settings)
│   │   ├── services/    # API client, localStorage utilities
│   │   └── App.jsx      # Main app component
│   └── package.json
├── tasks/               # Project documentation
│   ├── prd-gmail-auto-tagger.md
│   └── tasks-gmail-auto-tagger.md
└── README.md
```

## API Documentation

See `API_DOCS.md` (to be created) for detailed API endpoint documentation.

## Development

- Backend runs on port 3001
- Frontend runs on port 5173
- Database runs on port 5432

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

- **Backend**: Deploy to Heroku, Railway, or Google Cloud Platform
- **Frontend**: Deploy to Vercel or Netlify
- **Database**: Use managed PostgreSQL (e.g., ElephantSQL, Supabase)

## Security

- Gmail OAuth tokens are encrypted at rest
- OpenAI API keys stored locally in browser (never sent to backend)
- HTTPS required for production
- Input validation and sanitization on all endpoints

## Privacy

- We only read email metadata and content for matching purposes
- Email content is processed in-memory and never stored permanently
- You can disconnect and delete all your data at any time

## Contributing

This is a personal project. Contributions are welcome via pull requests.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

---

**Built by Jack Shen** | Former McKinsey Consultant
