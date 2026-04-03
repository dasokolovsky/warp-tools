import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierContacts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['dispatch', 'billing', 'operations', 'owner', 'sales', 'other']).default('other'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacts = await db
    .select()
    .from(carrierContacts)
    .where(eq(carrierContacts.carrierId, id));
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = ContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const contact = await db
    .insert(carrierContacts)
    .values({ ...parsed.data, carrierId: id })
    .returning();

  return NextResponse.json(contact[0], { status: 201 });
}
