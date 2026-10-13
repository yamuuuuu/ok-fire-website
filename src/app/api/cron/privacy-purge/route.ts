import { NextResponse } from 'next/server';
import { purgeCompletedInquiries } from '@/services/privacy-retention';
import { db } from '@/lib/db';
import { dispatchInquiryEmails } from '@/services/inquiry-email-worker';

export async function GET(request:Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Unauthorized',{status:401});
  const privacy = await purgeCompletedInquiries();
  const email = await dispatchInquiryEmails(db());
  return NextResponse.json({ ...privacy, email },{headers:{'Cache-Control':'no-store'}});
}
