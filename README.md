# Yoz Store Full Stack App

## Stack
- Backend: Node.js, Express, MongoDB, JWT, Joi, bcrypt, rate-limit
- Frontend: React + Vite

## Features
- User auth, balance wallet, top-up actions (mobile/internet)
- Transaction storage with pricing/profit snapshot
- Admin panel APIs for provider settings, pricing model, users, and transaction listing/filtering
- OneClickDZ v3 integration: validate, send mobile/internet, check by ref

## Run Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Summary
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/transactions/topup` (JWT)
- `GET /api/transactions/me` (JWT)
- `GET /api/admin/settings` (admin JWT)
- `PUT /api/admin/settings` (admin JWT)
- `GET /api/admin/users` (admin JWT)
- `PATCH /api/admin/users/:id` (admin JWT)
- `GET /api/transactions/admin/all` (admin JWT)
