# System Architecture

## 1. Technology Stack
* **Frontend:** [e.g., Next.js, React, TailwindCSS]
* **Backend:** [e.g., Node.js, Fastify, Python/FastAPI]
* **Database:** [e.g., PostgreSQL, MongoDB, Redis]
* **Infrastructure/Hosting:** [e.g., Vercel, AWS, Docker]

## 2. High-Level Application Flow
1. **Client Layer:** User interacts with the [Frontend Framework] interface. State is managed via [State Management Tool].
2. **API Layer:** Client sends requests to the API Gateway/Backend. Requests are validated and authenticated.
3. **Service Layer:** Business logic is executed. External integrations (if any) are triggered here.
4. **Data Layer:** The ORM/Query Builder interacts with the primary database to persist or retrieve data.

## 3. Data Flow
* **Reads:** Client -> API -> Cache (optional) -> Database -> API -> Client
* **Writes:** Client -> API -> Validation -> Database -> Invalidate Cache -> API -> Client

## 4. Recommended Folder Structure
```text
[PROJECT_NAME]/
├── apps/
│   ├── frontend/            # Web application codebase
│   │   ├── app/             # Routing and pages
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Utility functions and API clients
│   │   └── store/           # Global state management
│   └── backend/             # Server/API codebase
│       ├── src/
│       │   ├── controllers/ # Route handlers
│       │   ├── services/    # Business logic
│       │   └── routes/      # API route definitions
├── packages/                # Shared internal packages
│   ├── database/            # Database schema and ORM client
│   └── shared-types/        # Shared TypeScript interfaces
├── docs/                    # Architecture and project documentation
└── README.md                # Project entry point
```
