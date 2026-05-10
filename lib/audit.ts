// lib/audit.ts
// Place: /lib/audit.ts
// ------------------------------------------------------------

import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

interface AuditParams {
  actorId: number | null;
  action: string;
  entityType: string;
  entityId: number;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  req?: NextRequest;
}

export async function auditLog(params: AuditParams) {
  const ip =
    params.req?.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null;
  const ua = params.req?.headers.get('user-agent') ?? null;

  await db.query(
    `INSERT INTO audit_logs
       (actor_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.actorId,
      params.action,
      params.entityType,
      params.entityId,
      params.oldValue ? JSON.stringify(params.oldValue) : null,
      params.newValue ? JSON.stringify(params.newValue) : null,
      ip,
      ua,
    ],
  );
}