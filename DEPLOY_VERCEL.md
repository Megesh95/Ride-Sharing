# Deploy Smart Bicycle Sharing on Vercel

This repo is split into:
- `frontend/` (React + Vite)
- `backend/` (Express API)

Deploy them as **two Vercel projects**.

---

## 1) Deploy Backend (API)

1. In Vercel, click **Add New Project**.
2. Import `Megesh95/Ride-Sharing`.
3. Set **Root Directory** to `backend`.
4. Framework preset: **Other**.
5. Keep default build settings (Vercel uses `api/index.ts`).
6. Add Environment Variables:
   - `NODE_ENV=production`
   - `PORT=4000` (optional)
   - `MYSQL_HOST=...`
   - `MYSQL_PORT=3306`
   - `MYSQL_USER=...`
   - `MYSQL_PASSWORD=...`
   - `MYSQL_DATABASE=...`
   - `JWT_SECRET=...`
   - `JWT_EXPIRES_IN=7d`
   - `BCRYPT_SALT_ROUNDS=12`
   - `CORS_ORIGIN=https://<your-frontend-domain>.vercel.app`
   - `BASE_FARE=2.0`
7. Deploy.

After deploy, note API URL:
- `https://<your-backend-project>.vercel.app`

Test:
- `https://<your-backend-project>.vercel.app/health`

---

## 2) Deploy Frontend

1. Add another Vercel project from same repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**.
4. Add env:
   - `VITE_API_URL=https://<your-backend-project>.vercel.app`
5. Deploy.

Frontend URL will be:
- `https://<your-frontend-project>.vercel.app`

---

## 3) Update Backend CORS

After frontend deploy, ensure backend `CORS_ORIGIN` matches frontend URL exactly.
Then redeploy backend if needed.

---

## Notes

- The frontend has SPA rewrite config in `frontend/vercel.json`.
- The backend is serverless via `backend/api/index.ts` + `backend/vercel.json`.
- Your MySQL DB must be publicly reachable from Vercel (or use a hosted DB provider).

