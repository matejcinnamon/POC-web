import { NextRequest, NextResponse } from 'next/server';
import { forwardRequest, createSuccessResponse, createErrorResponse, getAuthHeader, copyCookies, BACKEND_URL } from '../../lib/api-proxy';

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    
    let { response, data } = await forwardRequest('/auth/me', {
      method: 'GET',
      headers: { 'Authorization': authHeader },
      includeAuth: true,
    });

    // If access token is expired, try to refresh silently then retry
    if (response.status === 401) {
      const refreshToken = request.cookies.get('refreshToken')?.value;
      const refreshTokenId = request.cookies.get('refreshTokenId')?.value;

      if (!refreshToken || !refreshTokenId) {
        return createErrorResponse('Unauthorized', 401);
      }

      const refreshResponse = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, refreshTokenId }),
      });

      if (!refreshResponse.ok) {
        return createErrorResponse('Unauthorized', 401);
      }

      const refreshData = await refreshResponse.json();
      const newToken = refreshData.token;

      // Retry /me with the fresh token
      const retry = await forwardRequest('/auth/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${newToken}` },
        includeAuth: true,
      });
      response = retry.response;
      data = retry.data;

      if (!response.ok) {
        return createErrorResponse(data.message || 'Failed to get user info', response.status);
      }

      const nextResponse = createSuccessResponse(data, 200);
      copyCookies(refreshResponse, nextResponse);
      return nextResponse;
    }

    if (!response.ok) {
      return createErrorResponse(data.message || 'Failed to get user info', response.status);
    }

    return createSuccessResponse(data, 200);
  } catch (error) {
    return createErrorResponse('Failed to connect to authentication service');
  }
}
