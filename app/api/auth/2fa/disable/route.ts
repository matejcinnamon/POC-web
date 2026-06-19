import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokenFromCookie = request.cookies.get('token')?.value;
    const authHeader = tokenFromCookie
      ? `Bearer ${tokenFromCookie}`
      : request.headers.get('Authorization') || '';

    // Forward 2FA disable request to backend
    const response = await fetch(`${BACKEND_URL}/auth/2fa/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('2FA disable proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
