# Smart Bicycle Sharing System (Backend)

## Tech
- Node.js + Express
- MySQL (2) + raw SQL
- JWT auth + role-based access (`user` / `admin`)
- bcrypt password hashing

## Environment
1. Copy `backend/.env.example` to `backend/.env`
2. Update MySQL credentials and `JWT_SECRET`

## Database setup
1. Create DB + tables:
   - Run `backend/sql/schema.sql` in MySQL (MySQL 8+).
2. Seed an admin user (optional):
   - `npm run seed-admin`

> Sample cycles are inserted by `schema.sql` if the `cycles` table is empty.

## Run server (dev)
```powershell
cd backend
npm run dev
```
Server runs on `http://localhost:${PORT}` (default `4000`).

## API Base URL
`http://localhost:${PORT}`

## Endpoints

### Auth
- `POST /auth/signup`
  - Body: `{ name, email, password }`
  - Returns: `{ token, user }`
- `POST /auth/login`
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

### Users (JWT required)
- `GET /users/me`
  - Returns: user, wallet balance, bookings, active ride (if any)

### Admin (JWT + role `admin`)
- `GET /users/admin/dashboard`
  - Returns: total users, total rides, revenue, average ride duration
- `GET /users/admin/analytics`
  - Returns: most used cycles, peak usage times

### Cycles
- `GET /cycles?lat=&lng=&distanceKm=&type=`
  - Nearby cycles (distance computed server-side from mock GPS)
  - Returns: `{ cycles: Cycle[] }`
- `GET /cycles/:id`
  - Returns: `{ cycle }`

Admin cycle management:
- `POST /cycles` (admin)
- `PUT /cycles/:id` (admin)
- `DELETE /cycles/:id` (admin)
- `PATCH /cycles/:id/status` (admin)

### Bookings
- `POST /bookings` (user)
  - Body: `{ cycleId, startTime }` where `startTime` is ISO string
  - Returns: `{ id }`
- `GET /bookings` (user)
  - Returns: `{ bookings }`
- `GET /bookings/all` (admin)
  - Returns: `{ bookings }`

### Rides
- `POST /rides/start` (user)
  - Body: `{ cycleId }`
- `GET /rides/active` (user)
  - Returns: `{ activeRide }` (includes `fareSoFar`)
- `POST /rides/end` (user)
  - Closes active ride, deducts wallet, writes history
- `GET /rides` (user)
  - Returns: `{ rides }` ride history

### Wallet
- `POST /wallet/add` (user)
  - Body: `{ amount }`
  - Returns: `{ balance }`
- `GET /wallet/balance` (user)
  - Returns: `{ balance }`
- `GET /wallet/transactions` (user)
  - Returns: `{ transactions }`

## OpenAPI
- Swagger UI: `GET /api-docs` (auto-generated, minimal in this starter).

