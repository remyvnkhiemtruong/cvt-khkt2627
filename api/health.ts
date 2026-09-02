import { academicHealth } from './_lib/academic.js';

const databaseEnvStatus = () => ({
  DATABASE_URL: Boolean(process.env.DATABASE_URL),
  POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
  POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL),
  NEON_DATABASE_URL: Boolean(process.env.NEON_DATABASE_URL),
  DATABASE_URL_UNPOOLED: Boolean(process.env.DATABASE_URL_UNPOOLED)
});

export default async function handler(req:any,res:any) {
  try {
    const counts=await academicHealth();
    return res.status(200).json({
      ok:true,
      service:'cvt-khkt2627-api',
      version:'backend-v2',
      academicData:'postgresql',
      aiFeedbackMode:'manual-review-queue',
      databaseEnv:databaseEnvStatus(),
      counts,
      timestamp:new Date().toISOString()
    });
  } catch(error:any) {
    return res.status(500).json({ok:false,version:'backend-v2',databaseEnv:databaseEnvStatus(),message:error?.message||'Backend unavailable',timestamp:new Date().toISOString()});
  }
}
