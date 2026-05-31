# 🚀 DevPulse – Internal Issue & Feature Tracker API
DevPulse is a backend REST API for managing software issues (bugs & feature requests) with authentication, role-based access control, and PostgreSQL using raw SQL only (no ORM, no query builder).

---

# 📌 Project Overview

DevPulse helps software teams to:

- 🐞 Report bugs
- ✨ Request features
- 📊 Track issue status
- 🔄 Manage workflow (`open → in_progress → resolved`)
 
# 🎯 Core Goal

To demonstrate a modular, scalable backend architecture using TypeScript, Express, JWT authentication, and PostgreSQL.

The project follows a clean modular architecture:

```text
Controller → Service → Database Layer
```

---

# 🛠️ Tech Stack

- Node.js (LTS)
- TypeScript
- Express.js
- PostgreSQL
- pg 
- bcrypt
- jsonwebtoken
- dotenv

---

# 📁 Project Structure

```text
src/
│
├── app.ts
├── server.ts
│
├── config/
│   └── index.ts
│
├── db/
│   └── index.ts
│
├── middleware/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   └── globalErrorHandler.ts
│
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.route.ts
│   │   ├── auth.interface.ts
│   │
│   └── issues/
│       ├── issues.controller.ts
│       ├── issues.service.ts
│       ├── issues.route.ts
│       ├── issues.interface.ts
│
├── types/
│   ├── jwt.type.ts
│   └── express.ts
│
├── utils/
│   ├── jwt.ts
│   └── sendResponse.ts
│
└── .env
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd devpulse
```

## 2️⃣ Install Dependencies

```bash
npm install
```

## 3️⃣ Create `.env` File

```env
CONNECTIONSTRING=postgresql://postgres:password@localhost:5432/devpulse

PORT=5000

JWT_SECRET=your_secret_key
```

## 4️⃣ Create Database

```sql
CREATE DATABASE devpulse;
```

---

# ▶️ Run Project

## 🔹 Development Mode

```bash
npm run dev
```

## 🔹 Build Project

```bash
npm run build
```

## 🔹 Production Mode

```bash
npm start
```

---

# 🌐 Base URL

```text
http://localhost:5000
```

---

# 🔐 Authentication System

## Flow

1. User Signup/Login
2. Server validates credentials
3. JWT token generated
4. Token sent to client
5. Client sends token in headers
6. Server verifies token

---

# 👥 User Roles

## 🧑 Contributor

- Register / Login
- Create issues
- View issues
- Update own issue (only if status = `open`)

## 🧑 Maintainer

- All contributor permissions
- Update any issue
- Delete any issue
- Manage workflow

---

# 🗄️ Database Schema

## 👤 users Table

| Column      | Type                      |
| ----------- | ------------------------- |
| id          | SERIAL PRIMARY KEY        |
| name        | VARCHAR                   |
| email       | UNIQUE                    |
| password    | TEXT (hashed)             |
| role        | contributor \| maintainer |
| created_at  | TIMESTAMP                 |
| updated_at  | TIMESTAMP                 |

---

## 🐞 issues Table

| Column      | Type                            |
| ----------- | ------------------------------- |
| id          | SERIAL PRIMARY KEY              |
| title       | VARCHAR(150)                    |
| description | TEXT (min 20 chars)             |
| type        | bug \| feature_request          |
| status      | open \| in_progress \| resolved |
| reporter_id | INT                             |
| created_at  | TIMESTAMP                       |
| updated_at  | TIMESTAMP                       |

---

# 🌐 API Endpoints

# 🔐 AUTH ROUTES

## ➤ Register User

```http
POST /api/auth/signup
```

## ➤ Login User

```http
POST /api/auth/login
```

---

# 🐞 ISSUES ROUTES

## ➤ Create Issue

```http
POST /api/issues
Authorization: Bearer <JWT_TOKEN>
```

## ➤ Get All Issues

```http
GET /api/issues?sort=newest&type=bug&status=open
```

## ➤ Get Single Issue

```http
GET /api/issues/:id
```

## ➤ Update Issue

```http
PATCH /api/issues/:id
Authorization: Bearer <JWT_TOKEN>
```

### Rules

- Contributor → only own issue + only if status = `open`
- Maintainer → full access

## ➤ Delete Issue

```http
DELETE /api/issues/:id
Authorization: Bearer <JWT_TOKEN>
```

👉 Only Maintainer can delete issues

---

# 🔒 Security Features

- bcrypt password hashing
- JWT authentication
- Role-based authorization
- Protected routes middleware
- Parameterized SQL queries (SQL Injection safe)

---

# 🚀 Future Improvements

- Input validation (Zod/Joi)
- Centralized error handling
- Logging system
- Swagger API documentation
- Database migrations
- Repository pattern

---

# 📄 License

This project is licensed under the MIT License.