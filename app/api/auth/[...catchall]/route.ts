import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({ message: 'Auth endpoint not found' }, { status: 404 });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ message: 'Auth endpoint not found' }, { status: 404 });
}
