import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carriers } from '@/db/schema';
import { eq, like, or, desc, asc } from 'drizzle-orm';
import { z } from 'zod';

const CreateCarrierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mcNumber: z.string().optional().nullable(),
  dotNumber: z.string().optional().nullable(),
  scacCode: z.string().optional().nullable(),
  addressStreet: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressState: z.string().optional().nullable(),
  addressZip: z.string().optional().nullable(),
  addressCountry: z.string().default('US'),
  website: z.string().optional().nullable(),
  equipmentTypes: z.array(z.string()).default([]),
  serviceAreas: z.array(z.any()).default([]),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive', 'blacklisted']).default('active'),
  authorityStatus: z.enum(['active', 'inactive', 'revoked', 'unknown']).default('unknown'),
  safetyRating: z.enum(['satisfactory', 'conditional', 'unsatisfactory', 'not_rated', 'unknown']).default('unknown'),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy') ?? 'name';
  const sortDir = searchParams.get('sortDir') ?? 'asc';

  let query = db.select().from(carriers);

  const conditions: ReturnType<typeof eq>[] = [];

  if (status && status !== 'all') {
    conditions.push(eq(carriers.status, status as 'active' | 'inactive' | 'blacklisted'));
  }

  if (search) {
    const term = `%${search}%`;
    const results = await db
      .select()
      .from(carriers)
      .where(
        or(
          like(carriers.name, term),
          like(carriers.mcNumber, term),
          like(carriers.dotNumber, term),
          like(carriers.scacCode, term),
        )
      )
      .orderBy(sortDir === 'desc' ? desc(carriers.name) : asc(carriers.name));
    return NextResponse.json(results);
  }

  const col = carriers[sortBy as keyof typeof carriers] as Parameters<typeof asc>[0] | undefined;
  const orderCol = col ?? carriers.name;

  const results = await db
    .select()
    .from(carriers)
    .orderBy(sortDir === 'desc' ? desc(orderCol) : asc(orderCol));

  // Apply status filter in JS since drizzle conditions can be tricky to compose dynamically
  const filtered = status && status !== 'all'
    ? results.filter((c) => c.status === status)
    : results;

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateCarrierSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { equipmentTypes, serviceAreas, tags, ...rest } = parsed.data;

  const carrier = await db
    .insert(carriers)
    .values({
      ...rest,
      equipmentTypes: JSON.stringify(equipmentTypes),
      serviceAreas: JSON.stringify(serviceAreas),
      tags: JSON.stringify(tags),
    })
    .returning();

  return NextResponse.json(carrier[0], { status: 201 });
}
