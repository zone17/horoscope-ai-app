import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { applyCorsHeaders } from '@/utils/cors-service';

// Valid zodiac signs
const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 
  'leo', 'virgo', 'libra', 'scorpio', 
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
  'space' // special background video
];

// Set route to be dynamic to prevent caching at edge level
export const dynamic = 'force-dynamic';

/**
 * API endpoint to check if video assets exist
 */
export async function GET(request: NextRequest) {
  try {
    // Get the origin for CORS
    const origin = request.headers.get('origin');
    console.log(`DEBUG-ASSETS: Request origin: ${origin}`);
    
    // Check if running in production or development
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`DEBUG-ASSETS: Running in ${process.env.NODE_ENV} mode`);
    
    const results = {};
    
    if (isProduction) {
      // In production, we can't access the filesystem directly
      // Instead, return the expected paths
      for (const sign of VALID_SIGNS) {
        const publicPath = `/videos/zodiac/${sign}.mp4`;
        results[sign] = {
          publicPath,
          staticPath: `public${publicPath}`,
          exists: "unknown (running in production)",
          note: "In production mode, we can't check files directly. The path listed is what the frontend will try to load."
        };
      }
    } else {
      // In development, actually check if files exist
      try {
        // Get public directory
        const publicDir = path.join(process.cwd(), 'public');
        const videosDir = path.join(publicDir, 'videos', 'zodiac');
        
        // Check if directories exist
        const publicExists = await fs.stat(publicDir).then(() => true).catch(() => false);
        const videosExists = await fs.stat(videosDir).then(() => true).catch(() => false);
        
        // List files in directory if it exists
        let filesInDir = [];
        if (videosExists) {
          filesInDir = await fs.readdir(videosDir);
        }
        
        // Check each sign
        for (const sign of VALID_SIGNS) {
          const fileName = `${sign}.mp4`;
          const publicPath = `/videos/zodiac/${fileName}`;
          const filePath = path.join(videosDir, fileName);
          
          let fileExists = false;
          if (videosExists) {
            fileExists = filesInDir.includes(fileName);
            if (fileExists) {
              // Double check with actual stat
              fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
            }
          }
          
          results[sign] = {
            publicPath,
            filePath,
            exists: fileExists,
            directoryExists: videosExists
          };
        }
      } catch (error) {
        console.error('DEBUG-ASSETS: Error checking files:', error);
        for (const sign of VALID_SIGNS) {
          results[sign] = {
            error: error instanceof Error ? error.message : 'Unknown error checking files'
          };
        }
      }
    }
    
    // Return results
    const response = NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      publicRoot: '/videos/zodiac',
      results,
      isBrowser: typeof window !== 'undefined',
      workingDirectory: process.cwd()
    });
    
    // Apply CORS headers and return
    return origin ? applyCorsHeaders(response, origin) : response;
  } catch (error) {
    console.error('DEBUG-ASSETS: Unexpected error:', error);
    
    // Get the origin for CORS
    const origin = request.headers.get('origin');
    
    // Create error response
    const errorResponse = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
    // Apply CORS headers and return
    return origin ? applyCorsHeaders(errorResponse, origin) : errorResponse;
  }
} 