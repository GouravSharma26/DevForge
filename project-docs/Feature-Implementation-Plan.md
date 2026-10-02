# Feature Implementation Plan

This document outlines the implementation plan for upcoming core features, broken down by domain.

## 1. AI Mock Interview & Grandmaster

**Goal:** Provide an interactive, real-time AI-driven interview and mentoring experience.

- [x] **Real-time Q&A Logic (`interview.socket.ts`)**
  - Establish Socket.IO event handlers for incoming user messages.
  - Integrate with the Gemini API to stream responses back to the client in real-time.
  - Maintain conversation context/history for the duration of the interview session.
- [x] **1-on-1 AI Agent UI (Interview Hub)**
  - Replace the current frontend stub with a fully interactive chat interface.
  - Implement streaming message rendering (typewriter effect) for AI responses.
  - Add controls to start, pause, and end the mock interview.

## 2. Dashboard & User Profile

**Goal:** Enhance the user dashboard and profile with dynamic, personalized data replacing hardcoded placeholders.

- [ ] **Resume Match Score API**
  - Create a new backend endpoint to analyze a user's resume against job descriptions using Gemini.
  - Update the dashboard UI to fetch and display the calculated match score.
- [ ] **DSA Recommendation Engine**
  - Build an endpoint that suggests Data Structures & Algorithms problems based on the user's past performance and skill gaps.
  - Integrate recommendations into the dashboard widget.
- [ ] **Recent Activity Feed**
  - Track user actions (e.g., problem submissions, arena matches, mock interviews completed).
  - Create an endpoint to serve paginated activity history.
  - Replace the placeholder UI on the user profile with the live activity feed.

## 3. Learning Paths & Configuration

**Goal:** Expand the platform's educational offerings and user account management capabilities.

- [ ] **Curriculum Tracks (Learning Paths)**
  - Define the data schema and seed data for structured curriculum tracks.
  - Remove the "Coming Soon" modal blocking the Learning Paths page.
  - Build the UI to display tracks, modules, and user progress.
- [ ] **Account Settings Expansion**
  - Implement the **Privacy** tab (profile visibility, data sharing toggles).
  - Implement the **Subscription** tab (billing integration stubs/UI, tier management).
  - Implement the **Points/Rewards** tab (XP history, redeemable items).
  - Implement the **Notifications** tab (email and push notification preferences).
- [ ] **OAuth Integrations**
  - Implement Google and GitHub OAuth strategies on the backend (using Fastify/Passport or similar).
  - Wire up the frontend login and registration pages to support social login flows.
  - Handle account linking for existing users who authenticate via OAuth.
