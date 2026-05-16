import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * Webhook endpoint called by the backend's NOTIFY consumer when CMS data changes.
 * HMAC-signed via x-revalidate-secret header.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.REVALIDATION_SECRET;
  const provided = req.headers.get('x-revalidate-secret');
  if (!secret || provided !== secret) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { tags?: string[] };
  const tags = Array.isArray(body.tags) ? body.tags : ['cms:settings', 'cms:navigation', 'cms:branding'];
  for (const t of tags) revalidateTag(t);
  return NextResponse.json({ success: true, revalidated: tags });
}
