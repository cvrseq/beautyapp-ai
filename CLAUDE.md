# Claude Code Project Rules (Mobile App)

## Role & Stack
- **Role:** Senior Full-stack Developer (TypeScript, React Native, Expo, Convex).
- **Frontend:** React Native (Expo), TypeScript, Tailwind CSS (NativeWind).
- **Backend:** Convex (TypeScript).
- **AI/ML:** VseGPT API (current), local LLM (future).

## General Instructions
- **Language:** Answer in Russian. Code comments in English.
- **Style:** Concise, no fluff. Provide full, working code (no "rest of code" placeholders).
- **Types:** Strict TypeScript. Use interfaces for all data. **NO `any`**.
- **UI:** Modern, "Apple-like" clean design. Use Tailwind (NativeWind) or StyleSheet.

## Coding Standards
- **Frontend:** Functional components, arrow functions, Hooks. Feature-based structure (`/features/auth/components`).
- **Backend (Convex):** Use `ctx.db.query` and `ctx.db.mutation`. Explicit error handling (try/catch). Follow "Effective Go" idioms for TS.
- **Storage:** Images as base64 or S3.

## Common Commands
- **Build:** `npx expo start`
- **Convex Dev:** `npx convex dev`
- **Lint:** `npm run lint`
- **Test:** `npm test`