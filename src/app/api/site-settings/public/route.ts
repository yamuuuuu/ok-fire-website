import { success,failure } from '@/lib/http'; import { db } from '@/lib/db';
export async function GET(){try{const rows=await db().siteSetting.findMany({select:{settingKey:true,settingValue:true,valueType:true}});return success(rows.map(r=>({key:r.settingKey,value:r.settingValue,valueType:r.valueType})));}catch(e){return failure(e);}}
