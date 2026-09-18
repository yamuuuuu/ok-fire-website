import { db } from '@/lib/db';
import { failure, readJson, success } from '@/lib/http';
import { z } from 'zod';

const schema=z.object({path:z.string().regex(/^\/(?:[a-z0-9/-]*)$/).max(255)}).strict();
const allowed=new Set(['/', '/about', '/services', '/works', '/faq', '/contact', '/privacy', '/services/fire-electric', '/services/fire-construction', '/services/fire-inspection', '/services/sprinkler-installation', '/services/fire-alarm-detection', '/services/seoul-fire-services']);
export async function POST(request:Request) { try { const parsed=schema.safeParse(await readJson(request,1024)); if(!parsed.success||!allowed.has(parsed.data.path)) return success({recorded:false}); const now=new Date(); const day=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())); await db().publicPageViewDaily.upsert({where:{day_path:{day,path:parsed.data.path}},create:{day,path:parsed.data.path,viewCount:1},update:{viewCount:{increment:1}}}); return success({recorded:true}); } catch(error) { return failure(error); } }
