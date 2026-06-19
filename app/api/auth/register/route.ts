import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward registration request to backend
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Create response with user data (tokens will be set as httpOnly cookies by backend)
    const nextResponse = NextResponse.json({
      userId: data.userId,
      email: data.email,
      message: 'Registration successful'
    }, { status: 201 });

    // Copy httpOnly cookies from backend response to Next.js response
    const cookies = response.headers.getSetCookie();
    cookies.forEach(cookie => {
      nextResponse.headers.append('Set-Cookie', cookie);
    });

    return nextResponse;
  } catch (error) {
    console.error('Register proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
