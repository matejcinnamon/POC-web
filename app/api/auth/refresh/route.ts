import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  try {
    // Try to get refresh tokens from cookies first
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const refreshTokenId = request.cookies.get('refreshTokenId')?.value;

    let body;
    if (refreshToken && refreshTokenId) {
      // Use cookies if available
      body = { refreshToken, refreshTokenId };
    } else {
      // Fall back to request body for mobile compatibility
      body = await request.json();
    }
    
    // Forward refresh request to backend
    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
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

    // Create response with user data
    const nextResponse = NextResponse.json({
      userId: data.userId,
      email: data.email,
      message: 'Token refreshed successfully'
    }, { status: 200 });

    // Copy updated httpOnly cookies from backend response
    const cookies = response.headers.getSetCookie();
    cookies.forEach(cookie => {
      nextResponse.headers.append('Set-Cookie', cookie);
    });

    return nextResponse;
  } catch (error) {
    console.error('Refresh proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
