import { academicHealth } from './_lib/academic.js';

export default async function handler(req:any,res:any) {
  try {
    const counts=await academicHealth();
    return res.status(200).json({
      ok:true,
      service:'cvt-khkt2627-api',
      version:'backend-v2',
      academicData:'postgresql',
      aiFeedbackMode:'manual-review-queue',
      counts,
      timestamp:new Date().toISOString()
    });
  } catch(error:any) {
    return res.status(500).json({
      ok:false,
      version:'backend-v2',
      message:error?.message||'Backend unavailable',
      timestamp:new Date().toISOString()
    });
  }
}
