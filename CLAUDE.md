# Claude Context

## Project Information

This repository contains Jack Shen's personal website and portfolio, with a primary focus on the **Command Center** project - an AI-powered consulting platform.

### Main Projects

#### 1. Command Center (`/command-center/`)
**Description:** A Palantir-style dark mode interface for managing multiple AI agents that work collaboratively to complete consulting projects.

**Key Features:**
- Multi-agent orchestration system
- Real-time progress tracking with WebSockets
- Firebase integration for data persistence
- Settings management for API keys (OpenAI, Anthropic, Exa AI)
- PDF upload and processing for context injection
- Central orchestrator that synthesizes agent outputs
- MCP (Model Context Protocol) server support

**Architecture:**
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Palantir-inspired dark theme)
- **Backend:** Node.js/Express with WebSocket support
- **Database:** Firebase Firestore
- **Services:** OpenAI, Anthropic (Claude), Exa AI integrations

**Key Components:**
- `server.js` - Express server with WebSocket + agent management
- `firebase-config.js` - Firebase/Firestore configuration and DB functions
- `agent-create.html/js` - Agent creation interface
- `settings.html/js` - API key and settings management
- `/backend/agents/` - Agent execution logic
- `/backend/services/` - External API wrappers
- `/backend/mcp-servers/` - MCP server implementations (e.g., Uber Eats)

#### 2. Personal Website (`/index.html`, `/writings/`, `/tinkering/`)
**Description:** Portfolio website showcasing projects, writings, and tinkering experiments.

**Sections:**
- About section with profile and video
- Writing section (`/writings/`) - Blog posts on various topics
- Tinkering section (`/tinkering/`) - Technical experiments and demos
- Project showcases (DayStory, RAG experiments, etc.)

### Important Context

**Firebase Structure:**
- Collection: `agents` - Stores agent configurations
- Collection: `projectContext` - Global project context (document ID: 'global')
- Collection: `uberEatsSearches` - Uber Eats search results

**Environment Variables:**
- OpenAI API keys stored in `/command-center/backend/.env`
- Firebase config in `/command-center/firebase-config.js`

**Port Configuration:**
- Backend server runs on port 3003
- Frontend accesses backend via `localhost:3003`

**Design System:**
- Background: Deep dark blue (#0F1419)
- Cards: Dark slate (#1A1F29)
- Accents: Blue (#3B82F6), Green (#10B981), Yellow (#F59E0B), Red (#EF4444)
- Font: Inter
- Dark mode, Palantir-inspired aesthetic

## Notes

- **Agent Types:** Research, Financial, Strategy, Industry Expert, Slide Production, Meeting Prep, Custom
- **Current Phase:** Backend integration complete, working on real-time agent execution
- **Key Documents:**
  - `ARCHITECTURE.md` - Detailed backend architecture
  - `README.md` - Feature overview and usage
  - `FIREBASE_SETUP.md` - Firebase configuration guide

## Tasks

<!-- Current development tasks -->

### Active Development
- Enhancing agent execution with better context management
- Improving real-time WebSocket updates
- Integrating MCP servers for extended capabilities
- Building agent creation UI with better UX

### Future Enhancements
- Debate Chamber: Agents debate findings to improve quality
- Voice Interface: Hands-free interactions
- Multi-project: Manage multiple engagements simultaneously
- Learning System: Agents learn from feedback

## Technical Guidelines

When working on this project:
1. **Firebase Operations:** Use the existing `agentDB`, `projectContextDB`, and `uberEatsDB` functions in `firebase-config.js`
2. **Agent Creation:** Follow the agent structure defined in `/backend/agents/Agent.js`
3. **API Integration:** Use service wrappers in `/backend/services/` for external APIs
4. **WebSocket Events:** Follow the event naming convention in ARCHITECTURE.md
5. **Error Handling:** All API calls should have proper try-catch and user-friendly error messages
6. **UI Consistency:** Maintain the dark Palantir theme across all interfaces
7. **Real-time Updates:** Use WebSocket for all progress/status updates

## Key Question

**What problem does Command Center solve?**
Command Center enables consultants to delegate complex, multi-faceted projects to AI agents that work autonomously and collaboratively, reducing partner time investment to just 2 daily check-ins while maintaining full transparency and quality control through an orchestrator system.

## Constraints

- Must support 10+ concurrent agents without performance degradation
- All API keys must be stored securely (encrypted in settings.json or .env)
- Real-time updates required for all agent progress
- Mobile-responsive design required
- Must work offline for cached data (localStorage fallback)

## Other Context

- **Owner:** Jack Shen (Former McKinsey consultant)
- **License:** Personal project for demonstration purposes
- **Deployment:** Frontend deployed via Vercel, Backend can run locally or on cloud
- **Firebase Project:** command-center-e0e8b
