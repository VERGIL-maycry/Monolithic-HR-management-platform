# HR Management Platform

A human resources management platform built as a **modular monolith** with Spring Boot, plus a React single-page app. It covers employee and department management, leave requests with approval workflows, in-app notifications, and an audit trail, all behind role-based access control.

## Features

- **Authentication**: JWT login with short-lived access tokens (15 min) and refresh tokens (7 days)
- **Role-based access control**: four roles, `ADMIN`, `HR`, `MANAGER` and `EMPLOYEE`, enforced on both the API and the UI routes
- **Employees and departments**: create, list, view and update records (HR/Admin write, Managers read)
- **Leave management**: paid, unpaid and sick leave; balance checks; request, approve, reject and cancel workflow with statuses `PENDING`, `APPROVED`, `REJECTED`, `CANCELED`
- **Team leaves view** for Managers, HR and Admins
- **Notifications**: users are notified when leave requests are created, approved or rejected
- **Audit log**: searchable history of actions, visible to HR and Admins
- **User administration**: Admins create users and change roles

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1, Spring Web MVC, Spring Data JPA, Spring Security, Bean Validation, Actuator |
| Auth | JWT ([jjwt](https://github.com/jwtk/jjwt) 0.12) |
| Database | PostgreSQL 16 |
| Frontend | React 19, TypeScript, Vite, React Router |
| Tests | JUnit / Spring Boot Test (backend), Vitest + Testing Library (frontend) |
| Deployment | Docker, Render (API + database), Vercel (frontend) |

## Architecture

The backend is a single deployable application split into self-contained modules under `com.hrplatform.app.modules`:

```
auth          users, login, JWT, roles
employee      employees and departments
leave         leave requests, balances, approval workflow
notification  in-app notifications
audit         audit log
```

Modules communicate through **Spring application events** rather than direct calls. For example, the `leave` module publishes `LeaveRequestedEvent`, `LeaveApprovedEvent` and `LeaveRejectedEvent`, which the `notification` and `audit` modules listen to. This keeps modules loosely coupled and makes a later split into services straightforward.

## Project structure

```
.
├── backend/               Spring Boot API (Maven, Dockerfile)
│   └── src/main/java/com/hrplatform/app/
│       ├── modules/       auth, employee, leave, notification, audit
│       ├── config/        security, CORS, JWT, database URL parsing
│       └── common/        shared exception handling
├── hr-frontend/           React + TypeScript + Vite app
├── postman/               Postman collection for the API
├── docker-compose.yml     PostgreSQL + API for local development
├── render.yaml            Render blueprint (API + database)
└── vercel.json            Vercel config (builds hr-frontend)
```

## Getting started

### Prerequisites

- Docker and Docker Compose
- Node.js 20.19+ (or 22.12+) and npm (for the frontend)
- JDK 21 (only if you run the backend without Docker)

### 1. Clone

```bash
git clone https://github.com/VERGIL-maycry/Monolithic-HR-management-platform.git
cd Monolithic-HR-management-platform
```

### 2. Start the backend and database

```bash
docker compose up --build
```

The API is available at http://localhost:8080 and PostgreSQL on port 5432. Tables are created automatically on first start.

To run the API outside Docker instead, start only the database and use the Maven wrapper:

```bash
cd backend
docker compose up -d db
./mvnw spring-boot:run        # on Windows: mvnw.cmd spring-boot:run
```

### 3. Start the frontend

```bash
cd hr-frontend
npm install
npm run dev
```

The app runs at http://localhost:5173. In development, Vite proxies `/api` requests to `http://localhost:8080`, so no extra configuration is needed.

### 4. Sign in

On first start the application seeds a default administrator account with the email `admin@hr.com`. **Change its password immediately** after your first login, and never keep the default credentials in a deployed environment.

## Configuration

### Backend

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL (`postgres://user:pass@host:5432/db`) | local `hr_platform` database |
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | Alternative to `DATABASE_URL` | `jdbc:postgresql://localhost:5432/hr_platform` |
| `JWT_SECRET` | Signing key, at least 256 bits. **Set a strong, private value in production.** | insecure development value |
| `APP_CORS_ALLOWED_ORIGIN_PATTERNS` | Comma-separated allowed origins | `http://localhost:5173,https://*.vercel.app` |
| `PORT` | HTTP port | `8080` |

### Frontend (`hr-frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Public URL of the API, without a trailing slash. Leave empty in local development. |

## API overview

All endpoints are under `/api` and require a Bearer token except login and refresh.

| Area | Endpoints | Access |
| --- | --- | --- |
| Auth | `POST /auth/login`, `POST /auth/refresh` | Public |
| Users | `GET /users/me` | Authenticated |
| | `POST /users`, `PATCH /users/{id}/role` | Admin |
| Employees | `GET /employees/me` | Authenticated |
| | `GET /employees`, `GET /employees/{id}` | Admin, HR, Manager |
| | `POST /employees`, `PUT /employees/{id}` | Admin, HR |
| Departments | `GET /departments`, `GET /departments/{id}` | Authenticated |
| | `POST /departments` | Admin, HR |
| Leaves | `POST /leaves`, `GET /leaves/me`, `GET /leaves/balance/me`, `POST /leaves/{id}/cancel` | Authenticated |
| | `GET /leaves/team`, `POST /leaves/{id}/approve`, `POST /leaves/{id}/reject` | Manager, HR, Admin |
| Notifications | `GET /notifications/me`, `GET /notifications/me/unread-count`, `PATCH /notifications/{id}/read` | Authenticated |
| Audit | `GET /audit/all`, `GET /audit/user`, `GET /audit/action` | Admin, HR |

A health check is exposed at `/actuator/health`. A ready-made Postman collection lives in the `postman/` folder.

## Tests

```bash
# Backend
cd backend
./mvnw test

# Frontend
cd hr-frontend
npm test
```

## Deployment

- **API and database (Render):** `render.yaml` defines a Docker web service built from `backend/Dockerfile` and a managed PostgreSQL database. `DATABASE_URL` is wired automatically, `JWT_SECRET` is generated, and `/actuator/health` is used as the health check.
- **Frontend (Vercel):** `vercel.json` builds `hr-frontend` with Vite and rewrites all non-API routes to `index.html` for client-side routing. Set `VITE_API_URL` to your Render API URL and add the Vercel domain to `APP_CORS_ALLOWED_ORIGIN_PATTERNS`.

## Roadmap ideas

- Database migrations with Flyway or Liquibase instead of `ddl-auto=update`
- Integration tests for the other modules
- Email notifications alongside in-app ones

## License

No license has been specified yet. Add a `LICENSE` file to define how others may use this project.
