# Fair Ranking Transaction System – MVP

A backend‑first MVP that implements a points‑based transaction system with fair ranking,
duplicate prevention, and anti‑abuse heuristics.

- **Backend:** Node.js + Express + MongoDB (Mongoose ODM)
- **Frontend:** Next.js (App Router) deployed on Vercel
- **Live URLs:** [frontend] / [backend] (replace with your deployed links)

---

## 1. How to Run Locally

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)

### Backend
```bash
cd backend
cp .env.example .env          # Edit MONGODB_URI and PORT
npm install
npm run dev                   # Starts on http://localhost:4000
```
### Frontend
```bash
cd frontend
cp .env.example .env.local    # Set NEXT_PUBLIC_API_URL to your backend URL
npm install
npm run dev                   # Starts on http://localhost:3000
```
### Environment Variables
**Backend:** MONGODB_URI, PORT, NODE_ENV (production/development)

**Frontend:** NEXT_PUBLIC_API_URL (backend base URL, e.g. http://localhost:4000)
