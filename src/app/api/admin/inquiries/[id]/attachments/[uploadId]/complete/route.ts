import { failure, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { completeUpload, databaseId } from '@/services/attachments';
export const runtime = 'nodejs'; export const maxDuration = 60;
export async function POST(request: Request, context: { params: Promise<{ id: string; uploadId: string }> }) { try { requireSameOrigin(request); await requireAdmin(); const params = await context.params; return success(await completeUpload(databaseId(params.id), params.uploadId)); } catch (error) { return failure(error); } }
