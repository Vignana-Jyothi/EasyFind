# EasyFind — Architecture & Pattern Matching

## Summary

- Pattern matching technique used: fuzzy string similarity via the `string-similarity` npm package (Sørensen–Dice / bigram-based similarity). This is used for approximate matching between item descriptions, names and categories to surface likely matches.

## Where pattern matching is used

- Backend: `backend/be9-easyfind/utils/emailDispatcher.js`
  - Uses `stringSimilarity.compareTwoStrings(item.description, checker)` to compute a similarity score.
  - The code enqueues email notifications when confirmed matches exceed a threshold (current threshold: `> 0.1`).

- Frontend (child): `frontend/fe9-easyfind-child/src/components/SearchItem.jsx`
  - Uses `stringSimilarity.compareTwoStrings(searchQuery, item.description)` to compute per-item similarity for sorting and filtering results.
  - The frontend sorts results by similarity score (descending) and effectively performs client-side fuzzy search.

## Brief on the technique

- `string-similarity` compares two strings using a bigram-based approach and returns a value in `[0,1]` (0 = no similarity, 1 = identical). Internally it constructs letter pairs and computes the Sørensen–Dice coefficient: similarity = (2 * intersection) / totalPairs.
- Implications:
  - Fast and lightweight; good for short descriptive text.
  - Sensitive to order and character differences; consider normalizing input (lowercase, trimming, remove punctuation) before comparing.

## Project layout (high level)

- `backend/be9-easyfind/` — Main backend API
  - `server.js` — Express app entry, connects to MongoDB, mounts routes and scheduler
  - `routes/` — `user.route.js`, `admin.route.js`, `auth.route.js`
  - `models/` — Mongoose models: `FoundItem.js`, `LostItem.js`, `User.js`, `Admin.js`, `EmailNotification.js`
  - `utils/` — `emailDispatcher.js`, `notifications.js`, `emailTemplates.js`, `upload.js`, `emailScheduler.js`
  - `config/` — `db.js`, `cloudinary.js`, `passport.js`
  - `.env` — contains `PORT`, `MONGODB_URI`, `JWT_SECRET`, `AUTH_SERVER_URL`, `FRONTEND_URL`, `CLOUDINARY_*`, email creds

- `backend/auth-server/` — Authentication/SSO service
  - `server.js` — Handles Google OAuth verification, issues JWT `userToken` cookie, endpoints: `/auth/google`, `/check-auth`, `/verify-token`, `/logout`
  - `.env` — `PORT`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBLIC_APPS`

- `frontend/fe9-easyfind-admin/` — Admin SPA (Vite + React)
- `frontend/fe9-easyfind-child/` — User-facing SPA (Vite + React)

## Key environment variables

- `backend/be9-easyfind/.env` (example values present)
  - `PORT` (e.g. 5000)
  - `MONGODB_URI` (e.g. `mongodb://127.0.0.1:27017/easyfind`)
  - `JWT_SECRET`, `AUTH_JWT_SECRET`
  - `AUTH_SERVER_URL` (e.g. `http://localhost:2999`)
  - `FRONTEND_URL` (frontend origin used for CORS)
  - `CLOUDINARY_*`, `EMAIL_USER`, `EMAIL_PASS`

- `backend/auth-server/.env`
  - `PORT` (e.g. 2999)
  - `JWT_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## How pattern matching thresholds are applied

- Backend email dispatch: similarity > 0.1 triggers notification attempts.
- Frontend search: similarity is used to sort; filter currently keeps items with `similarity >= 0` (no strict threshold), but UI displays highest similarity first.

## How to run (quick)

1. Ensure prerequisites: Node.js + npm, MongoDB running locally, optional Redis if used by queues.
2. Backend API
   - cd `backend/be9-easyfind`
   - `npm install`
   - configure `.env` (see `backend/be9-easyfind/.env`)
   - `npm run dev` (uses `nodemon`) or `npm start`
3. Auth server
   - cd `backend/auth-server`
   - `npm install`
   - configure `.env` (see `backend/auth-server/.env`)
   - `node server.js` (or `npx nodemon server.js`)
4. Frontends
   - cd `frontend/fe9-easyfind-admin` and `frontend/fe9-easyfind-child`
   - `npm install` and `npm run dev` (Vite will print dev URLs)

## Recommendations / Next steps

- Normalize text before similarity checks: lowercase, trim, remove punctuation, collapse whitespace.
- Consider configurable thresholds (env or admin UI) for `emailDispatcher` to tune false positives.
- For more advanced matching, consider:
  - Using token-based TF-IDF with cosine similarity for longer descriptions.
  - Using a dedicated fuzzy-search index (e.g., Fuse.js for client-side, Elastic/Lunr for backend).

## References (files)

- backend email dispatcher: [backend/be9-easyfind/utils/emailDispatcher.js](backend/be9-easyfind/utils/emailDispatcher.js#L1-L1)
- backend server: [backend/be9-easyfind/server.js](backend/be9-easyfind/server.js#L1-L1)
- auth server: [backend/auth-server/server.js](backend/auth-server/server.js#L1-L1)
- frontend search: [frontend/fe9-easyfind-child/src/components/SearchItem.jsx](frontend/fe9-easyfind-child/src/components/SearchItem.jsx#L1-L1)
