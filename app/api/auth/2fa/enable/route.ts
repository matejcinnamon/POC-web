import { NextRequest, NextResponse } from 'next/server';
import { 
  forwardRequest, 
  createSuccessResponse, 
  createErrorResponse, 
  getAuthHeader,
  validateAuthBody 
} from '../../../lib/api-proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateAuthBody(body, ['token']);
    if (!validation.valid) {
      return createErrorResponse(validation.error!, 400);
    }
    
    const authHeader = getAuthHeader(request);
    
    const { response, data } = await forwardRequest('/auth/2fa/enable', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
      includeAuth: true,
    });

    if (!response.ok) {
      return createErrorResponse(data.message || 'Failed to enable 2FA', response.status);
    }

    return createSuccessResponse(data, 200);
  } catch (error) {
    return createErrorResponse('Failed to connect to authentication service');
  }
}
