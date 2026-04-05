import { db } from '@/db';
import { portalCustomers } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'portal_token';

export async function validatePortalToken(token: string) {
  const results = await db
    .select()
    .from(portalCustomers)
    .where(
      and(
        eq(portalCustomers.accessToken, token),
        eq(portalCustomers.isActive, true)
      )
    )
    .limit(1);

  return results[0] ?? null;
}

export async function getPortalCustomer(request: Request) {
  // Check cookie first
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/portal_token=([^;]+)/);
  let token = match?.[1] ?? null;

  // Fall back to query param
  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get('token');
  }

  if (!token) return null;

  return validatePortalToken(token);
}

export function setPortalCookie(response: Response, token: string): Response {
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
  );
  return response;
}

export function clearPortalCookie(response: Response): Response {
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}

export async function getPortalCustomerFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return validatePortalToken(token);
}

export async function updateLastLogin(customerId: string) {
  await db
    .update(portalCustomers)
    .set({ lastLoginAt: sql`(datetime('now'))` })
    .where(eq(portalCustomers.id, customerId));
}
