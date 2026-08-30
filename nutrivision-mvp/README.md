# NutriVision MVP

This copy adds real manual meal logging, calorie/macro aggregation, reachable app tabs, configurable API endpoints, and safer server configuration.

## Run locally

1. Copy `backend/.env.example` to `backend/.env`, set `JWT_SECRET`, and start MongoDB.
2. In `backend`, run `npm install` then `npm start`.
3. Copy `frontend/.env.example` to `frontend/.env`, use your computer's LAN IP when testing on a physical device, then run `npx expo start`.

## Included MVP features

- Email/password authentication and biometrics-based calorie targets.
- Water and mood daily logging.
- Create, list, and delete manual meals with calorie and macro totals on the dashboard.
- Scan a food photo, review AI-proposed food items and macro estimates, then save confirmed items as meals.
- Nutrition, workout, and progress navigation that stays within the app.

## Deliberately external integrations

Photo food recognition uses Gemini. Add `GEMINI_API_KEY` to `backend/.env`; the app sends photos only to the authenticated backend, never directly from the phone to Gemini. Every estimate is editable and must be confirmed before saving. Google OAuth still requires provider credentials, device configuration, and server-side token verification.
