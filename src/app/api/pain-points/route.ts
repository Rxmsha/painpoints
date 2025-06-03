
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'pain_points.json');
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const painPoints = JSON.parse(data);
      return NextResponse.json(painPoints);
    } catch (error) {
      // File doesn't exist or is empty
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error loading pain points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
