# Implementation Plan - Backend Authentication & Biometrics Calculation

Set up authentication and biometrics routes in the `backend/` application using Node.js, Express, Mongoose, `jsonwebtoken`, and `bcryptjs`. This includes user signup, login, password hashing, JWT authorization middleware, and a protected biometrics calculation endpoint using the Mifflin-St Jeor formula.

## Proposed Changes

### Backend Dependencies & Server Setup

#### [NEW] [package.json](file:///d:/pro/nutrivision/backend/package.json)
- Initialize package.json with dependencies: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`.

#### [NEW] [.env](file:///d:/pro/nutrivision/backend/.env)
- Environment variables: `PORT=5000`, `MONGO_URI`, `JWT_SECRET`.

#### [MODIFY] [server.js](file:///d:/pro/nutrivision/backend/server.js)
- Express app setup with JSON parsing, CORS, MongoDB connection via Mongoose, and mounting auth routes at `/api/auth`.

---

### Models & Middleware

#### [NEW] [User.js](file:///d:/pro/nutrivision/backend/models/User.js)
- Define Mongoose User schema with fields:
  - `email` (String, required, unique, lowercase, trim)
  - `password` (String, required, hashed)
  - `age` (Number)
  - `height` (Number, in cm)
  - `currentWeight` (Number, in kg)
  - `targetWeight` (Number, in kg)
  - `pathway` (String, e.g. `'weight_loss'`, `'maintenance'`, `'weight_gain'`)
  - `gender` (String, default `'male'`)
  - `activityLevel` (Number/String, default 1.2 for sedentary)
  - `bmr` (Number)
  - `tdee` (Number)
  - `dailyCalorieTarget` (Number)
- Add pre-save password hashing hook using `bcryptjs`.
- Add instance method `comparePassword(candidatePassword)` for login validation.

#### [NEW] [auth.js](file:///d:/pro/nutrivision/backend/middleware/auth.js)
- Express middleware to verify JWT tokens from `Authorization: Bearer <token>` headers and attach `req.user` to the request object.

---

### Auth & Biometrics Controllers and Routes

#### [NEW] [authController.js](file:///d:/pro/nutrivision/backend/controllers/authController.js)
- `signup`: Handles registration, validates input, checks for existing user, hashes password, saves user, and returns JWT token.
- `login`: Handles login, verifies credentials with `bcryptjs`, and returns JWT token.
- `saveBiometrics` (Protected):
  - Receives `age`, `height`, `currentWeight`, `targetWeight`, `pathway`, `gender`, `activityLevel`.
  - Calculates BMR using Mifflin-St Jeor:
    $$\text{BMR} = 10 \times \text{weight} + 6.25 \times \text{height} - 5 \times \text{age} + (gender === \text{'female'} ? -161 : 5)$$
  - Calculates TDEE ($\text{BMR} \times \text{activityFactor}$).
  - Calculates `dailyCalorieTarget` based on `pathway` (e.g. weight loss = TDEE - 500 kcal/day, maintenance = TDEE, weight gain = TDEE + 500 kcal/day).
  - Updates and saves metrics in MongoDB for `req.user.id`.
  - Returns updated user data and calculated metrics.

#### [NEW] [authRoutes.js](file:///d:/pro/nutrivision/backend/routes/authRoutes.js)
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/biometrics` (Protected with `authMiddleware`)

---

## Verification Plan

### Automated / Syntax Verification
- Run `npm install` in `backend/`.
- Run node syntax check or test script to verify server startup and route imports.

### Manual Verification
- Test user registration (`/api/auth/signup`) and check token generation.
- Test user authentication (`/api/auth/login`) with valid and invalid credentials.
- Test protected route (`/api/auth/biometrics`) with JWT token: verify BMR, TDEE, and daily calorie target calculations according to Mifflin-St Jeor formula and MongoDB persistence.
