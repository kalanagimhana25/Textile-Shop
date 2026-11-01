# Textile Shop API

## Local development

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to the MongoDB Atlas connection URI for your cluster.
3. Set `VERCEL_ORIGIN` to your deployed frontend origin, such as `https://your-store.vercel.app`. Multiple origins can be comma-separated.
4. Set `JWT_SECRET` to a locally generated random secret of at least 32 bytes and set `JWT_EXPIRES_IN` (for example, `1d`).
5. From this directory, run `npm install` once and `npm run dev`.

The API listens on `http://localhost:5000` by default. `GET /api/health` reports the service and MongoDB connection state.

## Product catalog API

- `GET /api/products` — list products with populated category and department names.
- `GET /api/products/:id` — get one product.
- `POST /api/products` — create a product.
- `PUT /api/products/:id` — replace a product's editable fields.
- `DELETE /api/products/:id` — delete a product.
- `GET /api/categories` — list categories; optionally filter with `?department=<department-id>`.
- `GET /api/departments` — list departments.

Products refer to category and department IDs returned by the read endpoints. Their `sizes` array defines the available sizes, while each `colors` entry contains a color name, its image, and a `stockBySize` object with one non-negative integer quantity per size.

## Importing the existing catalog

The migration is manual and reads the normalized catalog from `src/data/product.js`; it does not run when the API starts. Before running it, confirm that the target Atlas database is the intended one. The script creates any missing department/category records and inserts or refreshes only the eight source products identified by stable migration keys. Re-running it updates those same source products and does not delete products or modify products without those keys.

From this directory, run:

```powershell
npm run migrate:products
```

The script requires `MONGODB_URI` in this directory's `.env`. Keep the URI private.

## Authentication and first administrator

- `POST /api/auth/register` creates customer accounts only; any role value in the request is ignored.
- `POST /api/auth/login` returns a signed bearer token and safe user information.
- `GET /api/auth/me` returns the current account and requires a valid bearer token.
- Product listing/details, categories, and departments remain public. Creating, updating, or deleting a product requires an administrator token.

Passwords must be at least 10 characters, include uppercase and lowercase letters plus a number, and fit within bcrypt's 72-byte input limit. To generate a JWT secret locally in PowerShell, run `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` from this directory, then put the output in `JWT_SECRET` in your local `.env`. Do not send or commit that value.

Create the initial admin manually, only once:

1. In `backend/.env`, temporarily set `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and a strong `BOOTSTRAP_ADMIN_PASSWORD`. Do not use a password you already use elsewhere.
2. From this directory, run `npm run bootstrap:admin`.
3. Remove the three bootstrap variables from `.env` immediately afterward.

The script uses a database transaction and a one-time database lock, and refuses to run if an administrator already exists or if the requested email already belongs to an account. It is not run by the API server. Public registration cannot create admins. Admin accounts should be created through a controlled operator process; do not expose this bootstrap script or its variables to public requests.

## Render deployment

- Create a Web Service using this repository.
- Set the service root directory to `backend`.
- Use `npm install` as the build command and `npm start` as the start command.
- Add `MONGODB_URI`, `VERCEL_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and (optionally) `PORT` as Render environment variables. Do not commit `.env` or paste credentials into source files. Do not configure bootstrap variables on the running web service.
- Add the Render service's outbound IP addresses to the Atlas network access list where available. Avoid opening Atlas to all IP addresses for production.

`PORT` defaults to 5000 locally; the service binds to `0.0.0.0` and uses Render's assigned `PORT` when deployed.
