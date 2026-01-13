import { NextRequest, NextResponse } from "next/server";
import { DJANGO_API_ENDPOINT } from '@/config/defaults'
import { getToken } from '@/lib/auth'

const DJANGO_SAVE_STEP_URL = `${DJANGO_API_ENDPOINT}/profiles/save-step`;

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const token = getToken();

    const res = await fetch(DJANGO_SAVE_STEP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const responseData = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ success: false, ...responseData }, { status: res.status });
    return NextResponse.json({ success: true, ...responseData }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
