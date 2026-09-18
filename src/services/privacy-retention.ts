import 'server-only';
import { db } from '@/lib/db';
import { deleteObject } from '@/lib/storage/s3';

export async function purgeCompletedInquiries() {
  const cutoff=new Date(Date.now()-5*24*60*60*1000);
  const rows=await db().inquiry.findMany({where:{deletedAt:null,status:{in:['COMPLETED','CANCELED']},updatedAt:{lt:cutoff}},take:100,select:{id:true,inquiryAttachmentsByInquiryId:{where:{deletedAt:null},select:{id:true,storageKey:true}}}});
  for(const row of rows) {
    for(const attachment of row.inquiryAttachmentsByInquiryId) try { await deleteObject(attachment.storageKey); } catch { /* Database anonymization still prevents application access. */ }
    await db().$transaction([db().inquiryAttachment.updateMany({where:{inquiryId:row.id,deletedAt:null},data:{deletedAt:new Date()}}),db().inquiry.update({where:{id:row.id},data:{customerName:'파기됨',phone:'00000000000',companyName:null,postalCode:null,address:'파기됨',addressDetail:null,description:'개인정보 보유기간 만료로 파기됨',preferredContactDetail:null,deletedAt:new Date()}}),db().adminActivityLog.create({data:{actionType:'PRIVACY_PURGED',targetType:'INQUIRY',targetId:row.id}})]);
  }
  return {purged:rows.length};
}
