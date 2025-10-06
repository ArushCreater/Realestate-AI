import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.PYTHON_API_URL || 'http://localhost:8000'}/market-trends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching market trends:', error);
    return NextResponse.json({ error: 'Failed to fetch market trends' }, { status: 500 });
  }
}

