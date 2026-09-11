# Authentication

The API uses PostgreSQL-backed accounts and signed JWT HttpOnly cookies.

Required Vercel environment variables:
- DATABASE_URL: Neon/PostgreSQL connection string
- JWT_SECRET: random secret at least 32 characters

Public self-registration is disabled. Accounts are provisioned and managed only by authorized administrators through the admin workflow (`/api/admin/manage`). Students sign in with the account issued by the school/administrator and must change a temporary password when required.
