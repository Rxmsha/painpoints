
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'pain_points.json');
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const painPoints = JSON.parse(content);
      
      // Get unique categories
      const categories = [...new Set(painPoints.map((point: any) => point.category))];
      
      return NextResponse.json({ categories: categories.sort() });
    } catch (error) {
      // If file doesn't exist, return default categories
      return NextResponse.json({
        categories: [
          'Technology',
          'E-commerce', 
          'Customer Service',
          'SaaS',
          'Marketing',
          'General Business'
        ]
      });
    }
    
  } catch (error) {
    console.error('Error loading categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
