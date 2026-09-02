# Authentication

The API now uses PostgreSQL-backed accounts and signed JWT HttpOnly cookies.

Required Vercel environment variables:
- DATABASE_URL: Neon/PostgreSQL connection string
- JWT_SECRET: random secret at least 32 characters

On first auth request, the schema is created and these accounts are inserted if absent:
- admin@cvt.edu.vn / Admin@2026! (admin)
- giaovien@cvt.edu.vn / Teacher@2026! (teacher)
- hocsinh@cvt.edu.vn / Student@2026! (student)

Students may self-register at POST /api/auth/register. Public registration always creates the student role. Change seed passwords immediately after first login.
