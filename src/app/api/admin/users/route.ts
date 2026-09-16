import { failure,requireSameOrigin,success } from '@/lib/http'; import { requireAdmin } from '@/lib/session'; import { createUser,listUsers } from '@/services/cms';
export async function GET(){try{await requireAdmin('SUPER_ADMIN');return success(await listUsers());}catch(e){return failure(e);}}
export async function POST(r:Request){try{requireSameOrigin(r);await requireAdmin('SUPER_ADMIN');return success(await createUser(),201);}catch(e){return failure(e);}}
