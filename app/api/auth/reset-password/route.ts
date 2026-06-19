import { NextRequest, NextResponse } from 'next/server';
import { 
  forwardRequest, 
  createSuccessResponse, 
  createErrorResponse,
  validateAuthBody 
} from '../../../lib/api-proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateAuthBody(body, ['token', 'newPassword']);
    if (!validation.valid) {
      return createErrorResponse(validation.error!, 400);
    }
    
    const { response, data } = await forwardRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return createErrorResponse(data.message || 'Failed to reset password', response.status);
    }

    return createSuccessResponse(data, 200);
  } catch (error) {
    return createErrorResponse('Failed to connect to authentication service');
  }
}
