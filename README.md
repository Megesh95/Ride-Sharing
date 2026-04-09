# Smart Bicycle Sharing System

This workspace contains:
- `backend/` (Express + MySQL + JWT + bcrypt)
- `frontend/` (React + routing + bottom navigation + live ride timer UI)

## Prerequisites
1. Node.js (Node 18+)
2. MySQL 8+

## Setup

### 1) Database
1. Open MySQL client and run: `backend/sql/schema.sql`
2. (Optional) Create admin user:
   - Copy `backend/.env.example` -> `backend/.env`
   - Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`
   - Run: `cd backend` then `npm run seed-admin`

### 2) Backend
1. `cd backend`
2. Copy `backend/.env.example` -> `backend/.env` and update MySQL + `JWT_SECRET` + `CORS_ORIGIN` if needed
3. `npm install` (if not already)
4. `npm run dev`
5. Backend base URL (default): `http://localhost:4000`

### 3) Frontend
1. `cd frontend`
2. Copy `frontend/.env.example` -> `frontend/.env` (or set `VITE_API_URL`)
3. `npm install` (if not already)
4. `npm run dev`
5. Frontend URL (default): `http://localhost:5173`

## Login
- Signup as a `user`
- Or login as admin (if you seeded admin):
  - `ADMIN_EMAIL` / `ADMIN_PASSWORD`

## Credentials/Routes
- Auth endpoints: `backend/src/routes/authRoutes.ts`
- User routes: `backend/src/routes/userRoutes.ts`
- Cycle booking/ride/wallet: `backend/src/routes/*Routes.ts`

