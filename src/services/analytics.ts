import 'server-only';
import { db } from '@/lib/db';
export async function pageViewSummary() { const since=new Date(); since.setUTCDate(since.getUTCDate()-29); const rows=await db().publicPageViewDaily.groupBy({by:['path'],where:{day:{gte:since}},_sum:{viewCount:true},orderBy:{_sum:{viewCount:'desc'}}}); const total=rows.reduce((sum,row)=>sum+(row._sum.viewCount??0),0); return {total,items:rows.map(row=>({path:row.path,count:row._sum.viewCount??0}))}; }
