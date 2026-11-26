import type { NextRequest } from 'next/server';
import { CrmError } from '@/lib/crm/client';
import { decideApproval } from '@/lib/crm/approval-actions';
import { verifySlackSignature, slackDecision } from '@/lib/crm/slack-verification';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime='nodejs';
export async function POST(request:NextRequest){
  try{
    if(Number(request.headers.get('content-length')||0)>262144)throw new CrmError(413,'Slack payload too large.');
    const reader=request.body?.getReader();const chunks:Uint8Array[]=[];let size=0;
    if(reader)for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>262144){await reader.cancel();throw new CrmError(413,'Slack payload too large.');}chunks.push(part.value);}
    const raw=Buffer.concat(chunks).toString('utf8');
    verifySlackSignature(raw,request.headers);
    await decideApproval(slackDecision(raw));
    return json({response_type:'ephemeral',text:'처리 결과를 기록했습니다. 승인된 작업은 실행 결과를 별도로 보고합니다.',replace_original:false});
  }catch(error){return failure(error);}
}
