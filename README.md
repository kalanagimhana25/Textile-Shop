# DAYFORM Textile Shop

DAYFORM is a React/Vite storefront backed by an Express API and MongoDB Atlas. This guide covers local development and deployment preparation. **Nothing in this guide deploys the application automatically.**

## Requirements

- Node.js 20.19+ or 22.12+ and npm (required by the current Vite toolchain).
- A MongoDB Atlas cluster and database user.
- Git and a GitHub repository.

## Run locally

### 1. Configure the backend

Copy `backend/.env.example` to `backend/.env`, then set:

| Variable | Local value |
| --- | --- |
| `PORT` | `5000` |
| `MONGODB_URI` | Your Atlas connection string, with a database name and URL-encoded credentials |
| `JWT_SECRET` | A random secret of at least 32 bytes |
| `JWT_EXPIRES_IN` | Token lifetime, for example `1d` |
| `VERCEL_ORIGIN` | Leave empty locally, or set the exact deployed frontend origin later |

Generate a secret locally from PowerShell in `backend`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Keep the output in the private backend `.env` only. Never put `MONGODB_URI`, `JWT_SECRET`, or bootstrap admin credentials in a frontend variable.

Install backend dependencies and start the API in one terminal:

```powershell
cd backend
npm install
npm run dev
```

The local API is `http://localhost:5000`. Check `http://localhost:5000/api/health` for the database connection state.

### 2. Configure and run the frontend

Copy `.env.example` to `.env`. For local development it should contain:

```env
VITE_API_URL=http://localhost:5000/api
```

In another terminal, from the repository root:

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Do not use a different local hostname unless it is added to the backend CORS allowlist.

### 3. Connect MongoDB Atlas

In Atlas, create a database user and allow the development machine's current IP address under Network Access. Copy the cluster connection string into `backend/.env` as `MONGODB_URI`, replacing the username, password, cluster host, and database name. URL-encode special characters in the username or password. Do not commit the resulting URI.

The project already contains the migrated catalog. Do not run the product migration unless you intentionally need to migrate source products; it updates products identified by migration keys.

## Authentication and administrator setup

Public registration creates customer accounts only. To create the first administrator, temporarily set `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` in the private `backend/.env`, then run `npm run bootstrap:admin` from `backend`. Remove those three variables after success. The bootstrap process refuses to create another initial admin if an admin already exists.

Bearer authentication tokens are stored in browser localStorage for this application. This is convenient but does not protect tokens from JavaScript running through an XSS vulnerability; use HTTPS and keep dependencies and browser-facing code maintained.

## Prepare GitHub

1. Review `git status` and inspect the changes you intend to publish.
2. Confirm `.env` files are ignored and only the placeholder `.env.example` files are committed:

   ```powershell
   git check-ignore -v .env backend/.env
   git status --short
   ```

3. Do not commit credentials, Atlas connection strings, bootstrap values, production tokens, or generated local data.
4. Push the reviewed branch to the GitHub repository you intend to deploy.

## Deploy the frontend to Vercel (when ready)

1. Import the GitHub repository into Vercel.
2. Set the project root to the repository root. Vercel should detect Vite; use `npm run build` and `dist` if prompted.
3. Add the environment variable `VITE_API_URL` for the Production environment, set to the deployed Render API origin followed by `/api` (for example, `https://<your-api-service>.onrender.com/api`). Add preview values separately if preview builds should use a different API.
4. Deploy only after confirming the backend is available and CORS is configured for the chosen Vercel domain.

`VITE_` variables are embedded in the public frontend build. Only the API base URL belongs there—never a private secret.

## Deploy the backend to Render (when ready)

1. Create a Render Web Service from the same GitHub repository.
2. Set **Root Directory** to `backend`, **Build Command** to `npm install`, and **Start Command** to `npm start`.
3. Add these environment variables in Render's service settings:

   | Variable | Value |
   | --- | --- |
   | `PORT` | Usually provided by Render; omit unless the service specifically requires it |
   | `MONGODB_URI` | Private Atlas connection string |
   | `JWT_SECRET` | Locally generated random value of at least 32 bytes |
   | `JWT_EXPIRES_IN` | For example `1d` |
   | `VERCEL_ORIGIN` | Exact public Vercel origin, such as `https://your-store.vercel.app`; comma-separate additional approved origins |

4. Do not set `BOOTSTRAP_ADMIN_*` on the running web service. Create an admin through the protected one-time bootstrap process instead.
5. In Atlas Network Access, allow the Render service's outbound IP addresses if available. Avoid opening Atlas to all IP addresses unless you understand and accept that exposure.

The backend does not hardcode a production URL. Render's assigned `PORT` is used when provided, and the service binds to `0.0.0.0`.

## Connect and verify the deployed services

1. Set Vercel's `VITE_API_URL` to the Render API origin plus `/api`.
2. Set Render's `VERCEL_ORIGIN` to the exact Vercel site origin (scheme and hostname, no path or trailing slash). Include other intended origins as comma-separated values. Do not use `*`.
3. Redeploy the frontend after changing `VITE_API_URL`, because Vite embeds it at build time. Restart/redeploy the backend after changing Render variables.
4. Open `https://<your-api-service>.onrender.com/api/health`; a healthy response reports `"status":"ok"` and a connected database.
5. Open the Vercel site, load the catalog, refresh a product detail URL directly, and exercise customer login, checkout, and admin access.
6. Confirm browser developer tools show no failed API requests or CORS errors. Do not share screenshots containing tokens or customer data.

## Useful commands

From the repository root:

```powershell
npm run lint
npm run build
```

From `backend`:

```powershell
npm start
npm run migrate:products -- --dry-run
```

The migration dry run reports the planned catalog changes without modifying records.

## Current scope and limitations

- Payments are not implemented; placing an order does not mean it is paid.
- Order checkout reserves stock and computes prices on the backend; cancellation restores reserved stock only when MongoDB transactions are supported.
- Product image URLs must already be hosted; uploads are not configured.
- Category creation is not exposed as an API.
- Vercel and Render are documentation targets only; this project has not been deployed by this guide.
