// This file handles catch-all routes for any future auth endpoints
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Auth endpoint not found' }, { status: 404 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Auth endpoint not found' }, { status: 404 });
}
