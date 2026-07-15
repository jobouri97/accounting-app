# Accounting App

React, Express, and PostgreSQL accounting application.

## Local development

1. Create a PostgreSQL database named `accounting_app`.
2. Copy `server/.env.example` to `server/.env` and update its values.
3. Copy `client/.env.example` to `client/.env` and update its values.
4. Install dependencies in both app folders:

   ```bash
   npm install --prefix server
   npm install --prefix client
   ```

5. Start the API and frontend in separate terminals:

   ```bash
   npm run dev --prefix server
   npm run dev --prefix client
   ```

Database migrations run automatically when the API starts.

## Deploy to Render

The repository includes `render.yaml`, which creates one web service connected to the Supabase PostgreSQL database. The Express service hosts both the API and the compiled frontend on the same domain, so authentication cookies work without cross-site browser restrictions.

1. Push the latest `main` branch to GitHub.
2. In Render, choose **New > Blueprint**.
3. Connect `jobouri97/accounting-app` and select its `render.yaml` file.
4. Enter the Supabase session-pooler connection string for `DATABASE_URL`.
5. Enter the same Google OAuth client ID for both requested Google environment variables.
6. Create the Blueprint and wait for the web service to become available.
7. Open the generated `https://accounting-app-....onrender.com` address.

The first startup automatically creates the database schema and applies every migration. Later deployments apply only new migrations.

## Google login setup

1. In Google Cloud Console, create or select a project and configure its OAuth consent screen.
2. Create an OAuth 2.0 Client ID for a **Web application**.
3. Add `http://localhost:5173` to **Authorized JavaScript origins** for local development.
4. After Render assigns the production URL, add that exact URL to **Authorized JavaScript origins**.
5. Do not add a trailing slash to either origin.

Use the same client ID for `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.

## Production configuration

Render configures or requests these values through `render.yaml`:

- `NODE_ENV=production`
- `DATABASE_URL` from your Supabase session pooler
- `DB_SSL=true`
- a generated `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_ID`

The health check is available at `/api/health`.

## Use Supabase for the database

1. Create a Supabase project.
2. Open **SQL Editor**, paste all of `server/db/supabase-schema.sql`, and run it.
3. In **Project Settings > Database**, copy the PostgreSQL connection string. Use the session pooler connection string when the app host does not support IPv6.
4. Set the server environment variables:

   ```env
   DATABASE_URL=your-supabase-postgresql-connection-string
   DB_SSL=true
   ```

5. Keep the database password and connection string only on the server. Do not add them to the React client environment.

The SQL script blocks the Supabase `anon` and `authenticated` Data API roles because this project authenticates and accesses data through the Express server.
