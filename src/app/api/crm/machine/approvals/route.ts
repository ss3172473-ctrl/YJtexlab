import type { NextRequest } from 'next/server';
import { bodyObject } from '@/lib/crm/auth';
import { requireApprovalWorker, approvalOperation, approvedActions } from '@/lib/crm/approval-actions';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime='nodejs';
export async function GET(request:NextRequest){try{requireApprovalWorker(request.headers);return json({actions:await approvedActions()});}catch(error){return failure(error);}}
export async function POST(request:NextRequest){try{requireApprovalWorker(request.headers);return json({approval:await approvalOperation(await bodyObject(request))});}catch(error){return failure(error);}}
