import { NextRequest, NextResponse } from 'next/server';
import { 
  forwardRequest, 
  createSuccessResponse, 
  createErrorResponse, 
  clearAuthCookies,
  getAuthHeader 
} from '../../lib/api-proxy';

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);

    // Forward logout request to backend (but don't fail if backend is unavailable)
    try {
      await forwardRequest('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
        includeAuth: true,
      });
    } catch (backendError) {
      // Log backend error but continue with logout
      console.warn('Backend logout failed:', backendError);
    }

    // Always clear client cookies regardless of backend response
    const nextResponse = createSuccessResponse({ message: 'Logged out successfully' }, 200);
    clearAuthCookies(nextResponse);

    return nextResponse;
  } catch (error) {
    return createErrorResponse('Failed to process logout request');
  }
}
