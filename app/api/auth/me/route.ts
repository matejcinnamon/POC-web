import { NextRequest, NextResponse } from 'next/server';
import { forwardRequest, createSuccessResponse, createErrorResponse, getAuthHeader } from '../../lib/api-proxy';

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    
    const { response, data } = await forwardRequest('/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
      includeAuth: true,
    });

    if (!response.ok) {
      return createErrorResponse(data.message || 'Failed to get user info', response.status);
    }

    return createSuccessResponse(data, 200);
  } catch (error) {
    return createErrorResponse('Failed to connect to authentication service');
  }
}
