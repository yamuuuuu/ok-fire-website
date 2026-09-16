import { failure,requireSameOrigin,success } from '@/lib/http'; import { requireAdmin } from '@/lib/session'; import { updateUser } from '@/services/cms';
export async function PATCH(r:Request){try{requireSameOrigin(r);await requireAdmin('SUPER_ADMIN');return success(await updateUser());}catch(e){return failure(e);}}
