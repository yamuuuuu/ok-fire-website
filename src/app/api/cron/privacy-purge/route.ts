import { NextResponse } from 'next/server';
import { purgeCompletedInquiries } from '@/services/privacy-retention';

export async function GET(request:Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Unauthorized',{status:401});
  return NextResponse.json(await purgeCompletedInquiries(),{headers:{'Cache-Control':'no-store'}});
}
