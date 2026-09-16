import { failure, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
export async function GET() {
  try { return success({ admin: await requireAdmin() }); }
  catch (error) { return failure(error); }
}
