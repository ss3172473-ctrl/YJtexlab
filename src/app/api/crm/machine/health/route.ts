import type {NextRequest} from 'next/server';
import {bodyObject} from '@/lib/crm/auth';
import {readHealth,recordHealth,requireHealth} from '@/lib/crm/health';
import {failure} from '@/lib/crm/http';
import {json} from '@/app/api/swatches/session';
export const runtime='nodejs';
export async function GET(request:NextRequest) {
 try {requireHealth(request.headers);return json({contractVersion:1,...await readHealth()});}catch(error){return failure(error);}
}
export async function POST(request:NextRequest) {
 try {requireHealth(request.headers);return json({contractVersion:1,receipt:await recordHealth(await bodyObject(request))});}catch(error){return failure(error);}
}
