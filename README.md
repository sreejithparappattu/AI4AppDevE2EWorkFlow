# Budget Pro

Budget Pro is a personal budgeting app with a React frontend, an Express API, and PostgreSQL storage. It supports account registration and login, a dashboard for income and expenses, transaction entry, and expense totals by category.

## Requirements

- Node.js 20 or newer
- PostgreSQL 13 or newer

## Run locally

1. Create a PostgreSQL database named `budget_pro`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string. Replace `JWT_SECRET` with a random secret of at least 32 characters.
3. Install dependencies and start both the API and Vite frontend:

   ```sh
   npm install
   npm run dev
   ```

4. Open <http://localhost:5173>.

The API creates the `users` and `transactions` tables when it starts. The API listens on port `3001` by default; set `PORT` or `CLIENT_ORIGIN` in `.env` to change the API port or frontend origin.

## Production

```sh
npm run build
NODE_ENV=production npm start
```

In production, Express serves the built frontend and API from the same origin. Set `DATABASE_URL` and a strong `JWT_SECRET` in the runtime environment, and serve the application over HTTPS so the session cookie is secure.

Passwords are stored as bcrypt hashes. Authentication uses an HTTP-only, same-site cookie; transaction queries are scoped to the signed-in user.
