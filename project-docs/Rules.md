# Development Rules & Guidelines

## 1. Coding Standards
* **Typing:** Strict typing is enforced. Avoid `any` types; define explicit interfaces or types.
* **Naming Conventions:**
  * Variables/Functions: `camelCase`
  * Components/Classes: `PascalCase`
  * Constants/Env Vars: `UPPER_SNAKE_CASE`
* **File Structure:** Co-locate tests and styles with their respective components.

## 2. AI-Interaction Guidelines
* **Context Loading:** Always direct the AI to read relevant documentation (`PRD.md`, `Architecture.md`) before generating complex code.
* **Refactoring:** Do not request large-scale architectural refactors from AI without providing a step-by-step phased approach.
* **Blind Spots:** Verify all AI-generated database queries, security middleware, and environment variables manually.

## 3. Do's and Don'ts
* **DO** commit frequently with descriptive conventional commit messages (e.g., `feat:`, `fix:`, `chore:`).
* **DO** write unit tests for critical business logic (e.g., payment processing, authentication).
* **DON'T** merge code that introduces new linting or TypeScript compilation errors.
* **DON'T** expose secrets or API keys in the client-side bundle or commit `.env` files.
