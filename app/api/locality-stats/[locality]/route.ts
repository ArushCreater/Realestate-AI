import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { locality: string } }
) {
  try {
    const locality = params.locality;
    
    const response = await fetch(
      `${process.env.PYTHON_API_URL || 'http://localhost:8000'}/locality-stats/${encodeURIComponent(locality)}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching locality stats:', error);
    return NextResponse.json({ error: 'Failed to fetch locality stats' }, { status: 500 });
  }
}

