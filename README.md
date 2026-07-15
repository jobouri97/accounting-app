# Accounting App

## Google login setup

1. In Google Cloud Console, create or select a project and configure its OAuth consent screen.
2. Create an OAuth 2.0 Client ID for a **Web application**.
3. Add `http://localhost:5173` to **Authorized JavaScript origins** for local development.
4. Use the same client ID in both environment files:

   `server/.env`

   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

   `client/.env`

   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

5. Apply `server/db/migrations/003_add_google_auth.sql` to the PostgreSQL database.
6. Restart both the server and client after changing environment variables.

For existing databases, also apply `server/db/migrations/004_scope_product_barcodes_to_users.sql`
so the same barcode can be used by different accounts while remaining unique within each account.

For production, add the production client URL to the Google client's authorized JavaScript origins and configure the same client ID on both deployed applications.

## Render deployment configuration

Deploy `server` as a Render Web Service and `client` as a Render Static Site.

> The current SQL migrations update an existing database; they do not create every base table. Before connecting a brand-new Render PostgreSQL database, add and apply a baseline schema migration.

Server environment variables:

```env
NODE_ENV=production
DATABASE_URL=your-render-postgres-internal-url
SESSION_SECRET=a-long-random-secret
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
CLIENT_ORIGIN=https://your-client.onrender.com
```

Client environment variables:

```env
VITE_API_URL=https://your-server.onrender.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Use `npm install` as the build command and `npm start` as the server start command. For the static client, use `npm install && npm run build` as the build command and `dist` as the publish directory.

In Google Cloud Console, add both `http://localhost:5173` and the final Render client URL, such as `https://your-client.onrender.com`, to the OAuth client's **Authorized JavaScript origins**. Do not add a trailing slash to `CLIENT_ORIGIN`, `VITE_API_URL`, or the Google origin.
