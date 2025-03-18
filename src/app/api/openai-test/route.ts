import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Set route to be publicly accessible
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test the API key with a simple request
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, this is a test.' }],
      max_tokens: 50,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'OpenAI API key is working correctly!',
      response: response.choices[0].message,
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return error response with proper type checking
    const errorMessage = error instanceof Error ? error.message : 'An error occurred with the OpenAI API';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
} 