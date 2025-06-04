
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface PainPoint {
  id: string;
  text: string;
  title: string;
  sentiment_score: number;
  business_keywords: string[];
  category: string;
  url: string;
  date: string;
  source: string;
  score: number;
  is_liked: boolean | null;
  is_unliked: boolean | null;
}

async function loadPainPoints(): Promise<PainPoint[]> {
  const filePath = path.join(process.cwd(), 'data', 'pain_points.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

async function savePainPoints(painPoints: PainPoint[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'pain_points.json');
  await fs.writeFile(filePath, JSON.stringify(painPoints, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const category = url.searchParams.get('category');
    const liked = url.searchParams.get('liked'); // 'true', 'false', or null
    const sortBy = url.searchParams.get('sortBy') || 'date'; // 'date', 'sentiment', 'score'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'; // 'asc' or 'desc'

    let painPoints = await loadPainPoints();
    
    // Filter by category
    if (category && category !== 'all') {
      painPoints = painPoints.filter(point => point.category === category);
    }
    
    // Filter by liked status
    if (liked === 'true') {
      painPoints = painPoints.filter(point => point.is_liked === true);
    } else if (liked === 'false') {
      painPoints = painPoints.filter(point => point.is_unliked === true);
    }
    
    // Sort
    painPoints.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'sentiment':
          aVal = a.sentiment_score;
          bVal = b.sentiment_score;
          break;
        case 'score':
          aVal = a.score;
          bVal = b.score;
          break;
        case 'date':
        default:
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    const totalItems = painPoints.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedData = painPoints.slice(startIndex, endIndex);
    
    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error loading pain points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, id } = await request.json();
    
    if (!action || !id) {
      return NextResponse.json({ error: 'Action and ID are required' }, { status: 400 });
    }
    
    const painPoints = await loadPainPoints();
    const pointIndex = painPoints.findIndex(point => point.id === id);
    
    if (pointIndex === -1) {
      return NextResponse.json({ error: 'Pain point not found' }, { status: 404 });
    }
    
    switch (action) {
      case 'like':
        painPoints[pointIndex].is_liked = true;
        painPoints[pointIndex].is_unliked = false;
        break;
      case 'unlike':
        painPoints[pointIndex].is_liked = false;
        painPoints[pointIndex].is_unliked = true;
        break;
      case 'clear':
        painPoints[pointIndex].is_liked = null;
        painPoints[pointIndex].is_unliked = null;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    await savePainPoints(painPoints);
    
    return NextResponse.json({ 
      message: 'Pain point updated successfully',
      painPoint: painPoints[pointIndex]
    });
    
  } catch (error) {
    console.error('Error updating pain point:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
