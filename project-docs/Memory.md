# Project Memory & Decision Log

> **Purpose:** This file acts as the project's brain. Record technical decisions, compromises, known technical debt, and architectural shifts here so future developers (and AI agents) understand the "why" behind the code.

## 1. Architecture Decisions (ADR)
* **[Date] - [Decision Subject]:** 
  * **Context:** [Why the decision was needed]
  * **Decision:** [What was chosen]
  * **Consequences:** [Trade-offs, e.g., "We chose MongoDB for rapid schema iteration, but we lose strict relational integrity."]

## 2. Known Technical Debt
* **[Component/Module Name]:** [Description of the shortcut taken] (e.g., "Authentication currently uses localStorage. Needs to be migrated to httpOnly cookies before public launch.")
* **[Component/Module Name]:** [Description of debt]

## 3. AI Agent Context Reminders
* **Environment:** Do not attempt to run tests that require a live database in the CI pipeline until the test-database container is configured.
* **State Management:** All global state must flow through the designated store; avoid passing props down more than 3 levels (prop drilling).
* **Code Execution:** [Add any specific rules about executing code or scripts within this repository].
