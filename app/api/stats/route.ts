import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(process.env.PYTHON_API_URL || 'http://localhost:8000');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

