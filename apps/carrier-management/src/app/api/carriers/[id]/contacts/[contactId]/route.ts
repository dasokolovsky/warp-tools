import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierContacts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const ContactUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['dispatch', 'billing', 'operations', 'owner', 'sales', 'other']).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  isPrimary: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string; contactId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, contactId } = await params;
  const body = await req.json();
  const parsed = ContactUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db
    .update(carrierContacts)
    .set(parsed.data)
    .where(and(eq(carrierContacts.id, contactId), eq(carrierContacts.carrierId, id)))
    .returning();

  if (!updated.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, contactId } = await params;

  const deleted = await db
    .delete(carrierContacts)
    .where(and(eq(carrierContacts.id, contactId), eq(carrierContacts.carrierId, id)))
    .returning();

  if (!deleted.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
