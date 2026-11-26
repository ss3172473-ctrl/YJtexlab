#!/usr/bin/env node
// Read a private gws values JSON backup; never write it or its codes into git.
import { readFile } from 'node:fs/promises';
import { createHmac, createCipheriv, randomBytes, randomUUID } from 'node:crypto';

export function prepareSnapshot(values, { source, hashKey, encryptionKey }) {
  if (!hashKey || hashKey.length < 32 || encryptionKey.length !== 32) throw new Error('Missing CRM_CODE_HASH_KEY or 32-byte base64 CRM_CODE_ENCRYPTION_KEY');
  const [headers, ...rows] = values;
  const required = ['업체명','이메일','고객 코드','활성 상태','가격 공개','접촉 상태'];
  for (const name of required) if (headers.filter(v => v === name).length !== 1) throw new Error(`Missing/duplicate header: ${name}`);
  const seen = new Set();
  let invalidEmails = 0;
  const data = rows.flatMap((row,index) => {
    if (!row.some(cell => String(cell ?? '').trim())) return [];
    const value = name => String(row[headers.indexOf(name)] ?? '').trim();
    const name = value('업체명');
    if (!name || name.length > 200) throw new Error(`Invalid company name at row ${index+2}`);
    const status = value('접촉 상태').replace(/\s+/g,'');
    const suppressed = ['영업중지','반송','수신거부'].includes(status);
    const emails = [...new Set(value('이메일').split(/[;,\n]+/).map(e => e.trim().toLowerCase()).filter(Boolean))];
    const validEmails = emails.filter(e => /^[^\s@;,]+@[^\s@;,]+\.[^\s@;,]+$/.test(e) && e.length <= 254);
    invalidEmails += emails.length - validEmails.length;
    const code = value('고객 코드').toUpperCase();
    if (code && !/^(?=.*[0-9])[A-Z0-9]{4}$/.test(code)) throw new Error(`Invalid code at row ${index+2}`);
    if (code && seen.has(code)) throw new Error(`Duplicate code at row ${index+2}`);
    if (code) seen.add(code);
    let encrypted = null;
    if (code) {
      const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
      const bytes = Buffer.concat([cipher.update(code,'utf8'), cipher.final()]);
      encrypted = [iv,cipher.getAuthTag(),bytes].map(b => b.toString('base64url')).join('.');
    }
    const metadata = Object.fromEntries(headers.flatMap((h,i) => h === '고객 코드' ? [] : [[h,row[i] ?? '']]));
    // Keyed digest detects source drift without revealing low-entropy codes.
    metadata.source_digest = createHmac('sha256',hashKey).update(JSON.stringify(row)).digest('hex');
    return [{ id:randomUUID(),row:index+2,name,source_key:`${source}:${index+2}`,can_view_prices:value('가격 공개') === '공개',legacy_metadata:metadata,
      contacts:validEmails.map((email,i) => ({email,is_primary:i===0,suppressed,suppression_reason:suppressed ? value('접촉 상태') : null})),
      code_hash:code ? createHmac('sha256',hashKey).update(`crm-code:${code}`).digest('base64url') : null,
      encrypted_code:encrypted,revoked:value('활성 상태') === '비활성' }];
  });
  return {data,summary:{companies:data.length,contacts:data.reduce((n,r)=>n+r.contacts.length,0),codes:data.filter(r=>r.code_hash).length,revoked:data.filter(r=>r.code_hash && r.revoked).length,priceVisible:data.filter(r=>r.can_view_prices).length,invalidEmails}};
}

async function main() {
  const args = process.argv.slice(2);
  const path = args.find(arg => !arg.startsWith('--'));
  if (!path) throw new Error('Usage: node scripts/import-crm-sheet.mjs /private/backup.json [--apply]');
  const input = JSON.parse(await readFile(path,'utf8'));
  const values = input.values ?? input.data?.values;
  if (!Array.isArray(values)) throw new Error('Expected gws values JSON');
  const source = process.env.CRM_IMPORT_SOURCE ?? '1NAeYMBW70KH6VxVonfpjRjY-IryQ1rTT_pmxPg11Euo:업체현황';
  const prepared = prepareSnapshot(values,{source,hashKey:process.env.CRM_CODE_HASH_KEY,encryptionKey:Buffer.from(process.env.CRM_CODE_ENCRYPTION_KEY ?? '','base64')});
  console.log(JSON.stringify({mode:args.includes('--apply')?'apply':'dry-run',...prepared.summary}));
  if (!args.includes('--apply')) return;
  const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !key) throw new Error('Missing Supabase URL/service key');
  const response = await fetch(`${url}/rest/v1/rpc/crm_import_snapshot`, {method:'POST',signal:AbortSignal.timeout(60_000),headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_rows:prepared.data,p_source:source})});
  if (!response.ok) { const error = await response.json().catch(()=>({})); throw new Error(`Import failed HTTP ${response.status}, code ${error.code ?? 'unknown'}; no sensitive details printed`); }
  console.log(JSON.stringify(await response.json()));
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main().catch(error => { console.error(error.message); process.exitCode=1; });
