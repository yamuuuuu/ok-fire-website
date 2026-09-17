import { requireAdmin } from '@/lib/session';
import { listUsers } from '@/services/cms';
import { UsersManager } from '@/components/admin/users-manager';
export const dynamic='force-dynamic';
export default async function Users(){await requireAdmin('SUPER_ADMIN');return <div><p className="text-sm text-slate-500">최고 관리자</p><h1 className="mt-2 text-3xl font-bold">관리자 관리</h1><div className="mt-6 max-w-3xl"><UsersManager admins={await listUsers()}/></div></div>;}
