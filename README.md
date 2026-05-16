# Ilocos Sur Property API

REST API backend for the Ilocos Sur Property platform. Serves the **public user app** (read-only listings, filters, aggregates) and the **admin console** (authentication, property CRUD, image uploads).

Built with **Node.js**, **Express 5**, **Prisma 7**, and **PostgreSQL**. Media is stored in **Cloudinary**; metadata lives in Postgres.

## Features

- **Public property API** — Paginated listings with search, filters, sorting, bounds, and city counts
- **Admin authentication** — JWT login for dashboard users (`AdminUser` table)
- **Admin property management** — Create, update, delete, and bulk delete listings
- **Image uploads** — Multipart uploads to Cloudinary (`properties` folder), with MIME/size validation
- **Bootstrap admin** — Optional first-run admin account when the database has no users
- **Security middleware** — Helmet, CORS allowlist, rate limiting, HPP, request timeouts
- **Docker support** — Postgres + API via Compose; migrations run on container start

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES modules) |
| Framework | Express 5 |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Database | PostgreSQL 15 |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Validation | Zod |
| Media | Cloudinary, Multer |
| Dev runner | `tsx` |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [PostgreSQL](https://www.postgresql.org/) 15+ (local install or Docker)
- [Cloudinary](https://cloudinary.com/) account (required for image upload endpoints)
- Optional: [Docker](https://www.docker.com/) and Docker Compose for the bundled stack

## Getting Started

### 1. Install dependencies

```bash
cd ilocos_sur_property_api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres credentials (Docker Compose) |
| `DATABASE_URL` | Prisma connection string. Use host `postgres` when the API runs in Docker; use `localhost` when running `npm run dev` on the host |
| `DATABASE_URL_LOCAL` | Convenience URL for host-side dev (see `.env.example`) |
| `PORT` | API listen port (default `3000`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (e.g. Expo web, admin dev server) |
| `ADMIN_JWT_SECRET` | Long random secret for signing admin tokens |
| `ADMIN_JWT_EXPIRES_IN` | Token lifetime (e.g. `12h`) |
| `ADMIN_BOOTSTRAP_USERNAME` | Optional initial admin username |
| `ADMIN_BOOTSTRAP_PASSWORD` | Optional initial admin password (only used when `AdminUser` table is empty) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `SEED_ON_START` | When `true`, Docker entrypoint runs `prisma db seed` after migrate |

Keep `POSTGRES_*` and `DATABASE_URL` in sync when you change the database password.

**CORS:** Add every frontend origin your team uses, for example:

```env
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:8082,http://localhost:3001,http://localhost:5173
```

(Expo user app, admin app, and other local dev ports.)

### 3. Database setup (local development)

With Postgres running on your machine:

```bash
# Point Prisma at localhost (use DATABASE_URL_LOCAL or set DATABASE_URL accordingly)
npx prisma migrate deploy
npx prisma generate
```

Optional — seed sample data (clears existing rows; uploads images to Cloudinary when configured):

```bash
npm run db:seed
```

### 4. Run the API

```bash
npm run dev
```

The server listens on `PORT` (default **3000**). On startup it may create a bootstrap admin if `ADMIN_BOOTSTRAP_PASSWORD` is set and no admin users exist.

## Docker (Postgres + API)

From the project root:

```bash
npm run docker:deploy
```

This runs `docker compose -f docker-compose.postgres.yml up --build -d`, starting:

- **postgres** — PostgreSQL 15 on port `5432`
- **api** — Builds the Dockerfile, runs migrations, then starts the server

Set `SEED_ON_START=true` in `.env` before deploy if you want mock data loaded on first container start.

Other Docker scripts:

| Command | Description |
|---------|-------------|
| `npm run docker:deploy:seed` | Run `prisma db seed` inside the running API container |
| `npm run docker:start` | Migrate + start (used in container entrypoint) |
| `npm run docker:start:seed` | Migrate + seed + start |

## Project Structure

```
ilocos_sur_property_api/
├── src/
│   ├── index.ts                 # Express app, CORS, middleware, route mounting
│   ├── routes/
│   │   ├── property.ts          # Public property endpoints
│   │   └── admin.ts             # Login, CRUD, media upload
│   ├── middleware/
│   │   ├── auth.ts              # Bearer JWT guard for admin routes
│   │   ├── security.ts          # Helmet, rate limits, timeout, HPP
│   │   └── validation.ts        # Zod request validation
│   ├── bootstrap/
│   │   └── admin-user.ts        # First-run admin creation
│   └── utils/                   # Password hashing, upload security
├── lib/
│   └── prisma.ts                # Prisma client (Pg adapter)
├── config/
│   └── cloudinary.tsx           # Cloudinary SDK config
├── prisma/
│   ├── schema.prisma            # Data model
│   ├── migrations/              # SQL migrations
│   ├── seed.ts                  # Dev seed script
│   └── data/mockProperties.ts
├── generated/prisma/            # Prisma client output
├── scripts/
│   └── docker-entry.sh          # Migrate (+ optional seed) + start
├── Dockerfile
├── docker-compose.postgres.yml
└── .env.example
```

## Data Model

Core entities (see `prisma/schema.prisma`):

| Model | Purpose |
|-------|---------|
| `Property` | Listing (type, status, price, areas, rooms, details) |
| `Location` | Address, city, barangay, province, boundaries |
| `Coordinate` | Lat/lng for map display |
| `Features` / `Amenity` | Tagged attributes (many-to-many) |
| `Media` | Images (URL + optional Cloudinary `public_id`) |
| `AdminUser` | Dashboard login accounts |

**Enums:** `PropertyType` (LOT, HOUSE, CONDO, COMMERCIAL), `PropertyStatus` (AVAILABLE, SOLD, RESERVED), `MediaType` (IMAGE, VIDEO).

## API Reference

Base URL: `http://localhost:3000` (or your deployed host).

### Public — `/property`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/property/getAll` | Paginated listings. Query: `searchQuery`, `type`, `status`, `features`, `amenities`, `minPrice`, `maxPrice`, `city`, `barangay`, `minArea`, `maxArea`, `sortBy`, `sortOrder`, `page`, `limit` |
| `GET` | `/property/bounds` | `{ maxPrice, maxLotArea }` for filter sliders |
| `GET` | `/property/city-counts` | `[{ city, count }, ...]` sorted by count |
| `POST` | `/property/upload` | Single public image upload → `{ url, public_id }` (5 MB max) |

**`GET /property/getAll` response:**

```json
{
  "data": [ /* properties with location, media, features, amenities */ ],
  "total": 42,
  "page": 1,
  "totalPages": 4
}
```

List items map Prisma fields to frontend names (`amenity` → `amenities`, `bedRooms` → `bedrooms`, etc.).

### Admin — `/admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/admin/auth/login` | No | `{ username, password }` → `{ accessToken, tokenType, expiresIn, expiresAt }` |
| `POST` | `/admin/media/upload` | Bearer | Multipart field `images` (up to 24 files, 5 MB each) → `{ items: [{ url, cloudinaryPublicId }] }` |
| `POST` | `/admin/property` | Bearer | Create property |
| `PUT` | `/admin/property/:id` | Bearer | Update property (replaces media; removes orphaned Cloudinary assets) |
| `DELETE` | `/admin/property/:id` | Bearer | Delete property and its Cloudinary media |
| `POST` | `/admin/property/delete-many` | Bearer | Body: `{ ids: [1, 2, 3] }` |

Protected routes require header: `Authorization: Bearer <accessToken>`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with `tsx` (watch-friendly) |
| `npm run db:deploy` | `prisma migrate deploy` + `prisma generate` |
| `npm run db:seed` | Run seed script |
| `npm run docker:deploy` | Docker Compose up (Postgres + API) |
| `npm run docker:deploy:seed` | Seed inside running API container |

## Security

- **CORS** — Only origins listed in `ALLOWED_ORIGINS` are accepted (browser requests without `Origin` are allowed for tools like curl).
- **Rate limits** — Global (120/min), upload (10/min), admin routes (45/min).
- **Upload validation** — Allowed image MIME types and magic-byte checks via `file-type`.
- **Request timeout** — 15 seconds (`connect-timeout`).
- **Helmet** + **HPP** — Standard HTTP hardening headers and parameter pollution protection.

## Connecting Frontends

| App | Typical env var | Example |
|-----|-----------------|---------|
| User (`ilocos_sur_property`) | `EXPO_PUBLIC_API_URL` | `http://localhost:3000` |
| Admin (`ilocos_sur_property_admin`) | `EXPO_PUBLIC_API_URL` | `http://localhost:3000` |

On a physical device, use your computer’s LAN IP instead of `localhost`. Android emulator: `http://10.0.2.2:3000`.

## Related Projects

| Project | Role |
|---------|------|
| **ilocos_sur_property** | Public property browser |
| **ilocos_sur_property_admin** | Admin dashboard |
| **ilocos_sur_property_api** (this repo) | Backend API + database |

## License

Private project — all rights reserved unless otherwise specified by the project owner.
