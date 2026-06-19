import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('token')?.value;
    const authHeader = tokenFromCookie
      ? `Bearer ${tokenFromCookie}`
      : request.headers.get('Authorization') || '';

    // Forward 2FA setup request to backend
    const response = await fetch(`${BACKEND_URL}/auth/2fa/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('2FA setup proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
