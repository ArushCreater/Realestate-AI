import { NextRequest, NextResponse } from 'next/server';
import { chatWithGemini } from '@/lib/gemini-tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for complex queries

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if Python backend is running
    try {
      const pythonUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
      const healthCheck = await fetch(pythonUrl, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!healthCheck.ok) {
        throw new Error('Python backend not responding');
      }
    } catch (error) {
      return NextResponse.json({
        error: 'Python backend is not running. Please start it with: cd python-backend && uvicorn main:app --reload',
        hint: 'Make sure you have converted the CSV to Parquet first: python convert_to_parquet.py'
      }, { status: 503 });
    }

    // Chat with Gemini using function calling
    console.log('📝 User query:', query);
    const aiResponse = await chatWithGemini(query);
    console.log('🤖 Gemini response:', aiResponse);

    return NextResponse.json({
      response: aiResponse,
      powered_by: 'Gemini 2.0 Flash with Function Calling + Pandas/Parquet Backend'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

