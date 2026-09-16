import 'dotenv/config';
import { createPrismaClient } from '../src/lib/prisma-client';
import { deleteObject, listPrivateObjects } from '../src/lib/storage/s3';

// Dry run by default. Only a dedicated OK소방 bucket may be configured for this job.
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Missing database configuration');
  const apply = process.argv.includes('--apply');
  const client = createPrismaClient(process.env.DATABASE_URL);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let candidates = 0;
  try {
    for (const prefix of ['quarantine/', 'private/']) {
      let continuation: string | undefined;
      do {
        const page = await listPrivateObjects(prefix, continuation);
        for (const object of page.Contents ?? []) {
          const key = object.Key;
          if (!key || !object.LastModified || object.LastModified >= cutoff) continue;
          if (!/^quarantine\/[a-f0-9-]{36}$|^private\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.jpg$/.test(key)) continue;
          // Retain all referenced images, including soft-deleted customer records.
          if (prefix === 'private/' && await client.inquiryAttachment.count({ where: { storageKey: key } })) continue;
          candidates++;
          if (apply) await deleteObject(key);
        }
        continuation = page.NextContinuationToken;
      } while (continuation);
    }
    const tickets = await client.uploadTicket.count({ where: { expiresAt: { lt: cutoff } } });
    if (apply) await client.uploadTicket.deleteMany({ where: { expiresAt: { lt: cutoff } } });
    console.log(`${apply ? 'Removed' : 'Dry run candidates'}: ${candidates} temporary/unreferenced objects, ${tickets} expired upload tickets.`);
  } finally { await client.$disconnect(); }
}
main().catch(() => { console.error('Storage cleanup failed. Check database/storage access; no request contents or secrets are logged.'); process.exit(1); });
