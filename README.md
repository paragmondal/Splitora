# Splitora

Splitora is a full-stack group expense splitting platform.

## Tech Stack

- Backend: Node.js, Express, Prisma
- Frontend: React, Vite, Tailwind CSS

## Repository Structure

```text
Splitora/
├── server/         # Node.js + Express + Prisma backend
├── client/         # React + Vite + Tailwind frontend
├── .gitignore
└── README.md
```

## Setup Instructions

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd Splitora
```

### 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Fill in the values in `.env` for your local environment.

### 3. Frontend setup

```bash
cd ../client
npm install
cp .env.example .env
```

### 4. Run the apps

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

## Environment variables

### Backend (`server/.env`)

- `DATABASE_URL` (required): Prisma database URL
- `DIRECT_URL` (optional): direct DB URL for migrations/Prisma adapter fallback
- `JWT_SECRET` (required): JWT access token signing secret
- `JWT_REFRESH_SECRET` (required): JWT refresh token signing secret
- `JWT_EXPIRES_IN` (optional, default `15m`): access token expiry
- `JWT_REFRESH_EXPIRES_IN` (optional, default `7d`): refresh token expiry
- `PORT` (optional, default `10000`): backend port
- `NODE_ENV` (optional): runtime environment (`development`/`production`)
- `CLIENT_URL` (required for invite links): frontend origin, e.g. `https://your-app.vercel.app`
- `GOOGLE_CLIENT_ID` (optional): Google OAuth client id if Google auth is enabled
- `ANTHROPIC_API_KEY` (optional): enables AI insights/suggestions endpoint
- `RAZORPAY_KEY_ID` (required for payments): Razorpay public key id
- `RAZORPAY_KEY_SECRET` (required for payments): Razorpay secret key
- `CLOUDINARY_CLOUD_NAME` (required for avatar uploads)
- `CLOUDINARY_API_KEY` (required for avatar uploads)
- `CLOUDINARY_API_SECRET` (required for avatar uploads)
- `SEED_USER_PASSWORD` (optional, default `password123`): seed user password

### Frontend (`client/.env`)

- `VITE_API_URL` (optional): backend origin (without `/api`), defaults to hosted API
- `VITE_GOOGLE_CLIENT_ID` (optional): Google OAuth client id for client-side integration
