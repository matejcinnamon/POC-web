import { NextRequest, NextResponse } from 'next/server';
import { 
  forwardRequest, 
  createSuccessResponse, 
  createErrorResponse, 
  copyCookies,
  validateAuthBody 
} from '../../lib/api-proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateAuthBody(body, ['email', 'password']);
    if (!validation.valid) {
      return createErrorResponse(validation.error!, 400);
    }
    
    const { response, data } = await forwardRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return createErrorResponse(data.message || 'Login failed', response.status);
    }

    // Create response with user data
    const nextResponse = createSuccessResponse({
      userId: data.userId,
      email: data.email,
      message: 'Login successful'
    }, 200);

    // Copy httpOnly cookies from backend response
    copyCookies(response, nextResponse);

    return nextResponse;
  } catch (error) {
    return createErrorResponse('Failed to connect to authentication service');
  }
}
