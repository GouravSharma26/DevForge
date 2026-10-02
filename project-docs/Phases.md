# Project Phases & Milestones

## Phase 0: Foundation & Scaffolding
* Initialize repository and monorepo structure.
* Configure linters, formatters, and TypeScript compiler.
* Set up database schema and ORM.
* Configure CI/CD pipeline and deployment targets.

## Phase 1: Authentication & Core Infrastructure (MVP Stage 1)
* Implement user registration, login, and session handling.
* Build global UI layout (Navbar, Footer, Sidebar).
* Establish secure routing and API middleware.

## Phase 2: AI Mock Interview & Grandmaster (MVP Stage 2)
* Implement `interview.socket.ts` real-time Q&A logic (handle incoming messages, send to Gemini, and stream response).
* Build the 1-on-1 AI Agent for the Interview Hub (currently stubbed).

## Phase 3: Dashboard, Profile & Learning Paths (Beta Readiness)
* Implement Resume Match Score API for the dashboard (currently hardcoded/missing).
* Build the DSA Recommendation Engine endpoint.
* Create the Recent Activity Feed for user profiles to replace placeholder UI.
* Implement Curriculum Tracks for Learning Paths (currently blocked by a modal).
* Build missing Account Settings tabs (Privacy, Subscription, Points, Notifications).
* Implement OAuth (Google/GitHub) integrations on the backend and wire up to the frontend UI.

## Phase 4: Testing, Optimization & Launch
* Conduct E2E and load testing.
* Perform security audit (CORS, JWT handling, SQL injection).
* Optimize bundle sizes and database query performance.
* **Release v1.0 to Production.**
