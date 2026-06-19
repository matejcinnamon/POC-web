import { NextRequest, NextResponse } from 'next/server';

// Environment validation
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
if (!BACKEND_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

// Standardized cookie security settings
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

// Clear cookie options for logout
export const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 0,
};

// Error message sanitizer
export function sanitizeErrorMessage(message: string): string {
  // Remove potential sensitive information from error messages
  const sensitivePatterns = [
    /database/gi,
    /sql/gi,
    /internal server/gi,
    /stack trace/gi,
    /exception/gi,
    /error:.*\d+/gi,
  ];

  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // Limit message length to prevent information disclosure
  return sanitized.length > 200 ? sanitized.substring(0, 200) + '...' : sanitized;
}

// Standardized error response
export function createErrorResponse(message: string, status: number = 500): NextResponse {
  const sanitizedMessage = sanitizeErrorMessage(message);
  console.error('API Error:', { message, status });
  
  return NextResponse.json(
    { 
      message: status >= 500 ? 'Internal server error' : sanitizedMessage,
      ...(process.env.NODE_ENV === 'development' && { debug: message })
    },
    { status }
  );
}

// Standardized success response
export function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

// Forward request to backend with proper error handling
export async function forwardRequest(
  endpoint: string,
  options: RequestInit & { includeAuth?: boolean }
): Promise<{ response: Response; data: any }> {
  const { includeAuth = false, ...fetchOptions } = options;
  
  try {
    const url = `${BACKEND_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { response, data };
  } catch (error) {
    console.error('Backend request failed:', error);
    throw new Error('Failed to connect to backend service');
  }
}

// Copy cookies from backend response to Next.js response
export function copyCookies(backendResponse: Response, nextResponse: NextResponse): void {
  const cookies = backendResponse.headers.getSetCookie();
  cookies.forEach(cookie => {
    nextResponse.headers.append('Set-Cookie', cookie);
  });
}

// Clear authentication cookies
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set('token', '', CLEAR_COOKIE_OPTIONS);
  response.cookies.set('refreshToken', '', CLEAR_COOKIE_OPTIONS);
  response.cookies.set('refreshTokenId', '', CLEAR_COOKIE_OPTIONS);
}

// Validate request body for common auth endpoints
export function validateAuthBody(body: any, requiredFields: string[]): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  for (const field of requiredFields) {
    if (!body[field] || typeof body[field] !== 'string') {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Email validation
  if (requiredFields.includes('email') && body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return { valid: false, error: 'Invalid email format' };
    }
  }

  // Password validation
  if (requiredFields.includes('password') && body.password) {
    if (body.password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
  }

  return { valid: true };
}

// Get authorization header from request
export function getAuthHeader(request: NextRequest): string {
  const tokenFromCookie = request.cookies.get('token')?.value;
  return tokenFromCookie ? `Bearer ${tokenFromCookie}` : request.headers.get('Authorization') || '';
}
