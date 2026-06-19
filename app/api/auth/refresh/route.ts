import { NextRequest, NextResponse } from 'next/server';
import { 
  forwardRequest, 
  createSuccessResponse, 
  createErrorResponse, 
  copyCookies 
} from '../../lib/api-proxy';

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
    
    const { response, data } = await forwardRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return createErrorResponse(data.message || 'Token refresh failed', response.status);
    }

    // Create response with user data
    const nextResponse = createSuccessResponse({
      userId: data.userId,
      email: data.email,
      message: 'Token refreshed successfully'
    }, 200);

    // Copy updated httpOnly cookies from backend response
    copyCookies(response, nextResponse);

    return nextResponse;
  } catch (error) {
    return createErrorResponse('Failed to refresh authentication token');
  }
}
