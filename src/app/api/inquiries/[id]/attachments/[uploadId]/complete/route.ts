import { failure, requireSameOrigin, success } from '@/lib/http';
import { completeUpload, requireUploadOwner } from '@/services/attachments';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request, context: { params: Promise<{ id: string; uploadId: string }> }) {
  try {
    requireSameOrigin(request);
    const params = await context.params;
    const owner = await requireUploadOwner(request, params.id);
    return success(await completeUpload(owner.id, params.uploadId));
  } catch (error) { return failure(error); }
}
