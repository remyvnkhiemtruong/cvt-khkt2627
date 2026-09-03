export function databaseUrl() {
  const raw = String(process.env.DATABASE_URL || '');
  if (!raw) throw new Error('DATABASE_URL is not configured');
  if (/[?&]sslmode=/i.test(raw)) {
    return raw.replace(/([?&])sslmode=[^&]*/i, '$1sslmode=verify-full');
  }
  return `${raw}${raw.includes('?') ? '&' : '?'}sslmode=verify-full`;
}
