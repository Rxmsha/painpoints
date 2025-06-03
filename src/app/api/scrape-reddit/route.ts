
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Business-related keywords for filtering
const BUSINESS_KEYWORDS = [
  'product', 'service', 'company', 'app', 'software', 'store', 'feature',
  'customer support', 'subscription', 'update', 'bug', 'price', 'website',
  'platform', 'tool', 'business', 'startup', 'entrepreneur', 'market',
  'customer', 'user experience', 'interface', 'payment', 'billing'
];

// Pain point keywords
const PAIN_KEYWORDS = [
  'frustrated with', 'annoyed by', 'wish there was', 'problem with',
  'hate it when', 'bad experience', 'terrible', 'awful', 'worst',
  'disappointed', 'angry', 'irritated', 'broken', 'doesn\'t work'
];

// Simple sentiment analysis function (basic implementation)
function analyzeSentiment(text: string): number {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed', 'frustrated', 'annoyed', 'broken', 'useless'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });
  
  // Normalize score
  return Math.max(-1, Math.min(1, score / Math.max(words.length / 10, 1)));
}

// Check if text contains business-related keywords
function containsBusinessKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  return BUSINESS_KEYWORDS.filter(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Mock Reddit data (since we can't use PRAW in this environment)
function generateMockRedditData(subreddits: string[], keywords: string[]) {
  const mockPosts = [
    {
      title: "Frustrated with customer support software that doesn't work",
      text: "I run a small business and the customer support platform we use is terrible. It crashes constantly and loses chat history. Customers get frustrated and we look unprofessional.",
      url: "https://reddit.com/r/entrepreneur/mock1",
      subreddit: "entrepreneur",
      score: 45,
      date: new Date().toISOString()
    },
    {
      title: "Wish there was a better project management tool",
      text: "All the existing project management apps are either too complex or too simple. I need something that works for a team of 5-10 people without being overwhelming.",
      url: "https://reddit.com/r/smallbusiness/mock2",
      subreddit: "smallbusiness",
      score: 32,
      date: new Date().toISOString()
    },
    {
      title: "Problem with payment processing fees",
      text: "These payment processors are killing small businesses with their fees. 3.5% plus transaction fees add up quickly when you're trying to bootstrap a startup.",
      url: "https://reddit.com/r/startups/mock3",
      subreddit: "startups",
      score: 67,
      date: new Date().toISOString()
    },
    {
      title: "Bad experience with website builders",
      text: "Tried 5 different website builders and they all have major limitations. Either the templates look generic or the customization options are locked behind expensive plans.",
      url: "https://reddit.com/r/entrepreneur/mock4",
      subreddit: "entrepreneur",
      score: 28,
      date: new Date().toISOString()
    }
  ];

  return mockPosts.filter(post => 
    subreddits.some(sub => post.subreddit.includes(sub.toLowerCase())) &&
    keywords.some(keyword => 
      post.title.toLowerCase().includes(keyword.toLowerCase()) ||
      post.text.toLowerCase().includes(keyword.toLowerCase())
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    const { subreddits, keywords } = await request.json();

    if (!subreddits || !keywords || subreddits.length === 0 || keywords.length === 0) {
      return NextResponse.json({ error: 'Subreddits and keywords are required' }, { status: 400 });
    }

    // Generate mock data (replace with actual Reddit API calls when available)
    const mockData = generateMockRedditData(subreddits, keywords);
    
    // Process and filter the data
    const painPoints = mockData
      .map(post => {
        const fullText = `${post.title} ${post.text}`;
        const sentiment = analyzeSentiment(fullText);
        const businessKeywords = containsBusinessKeywords(fullText);
        
        return {
          id: `${post.subreddit}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: fullText,
          sentiment_score: sentiment,
          business_keywords: businessKeywords,
          url: post.url,
          date: post.date,
          source: `r/${post.subreddit}`
        };
      })
      .filter(point => 
        point.sentiment_score < -0.1 && // Negative sentiment
        point.business_keywords.length > 0 // Contains business keywords
      );

    // Save to local storage (in a real app, you'd use a database)
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    const filePath = path.join(dataDir, 'pain_points.json');
    await fs.writeFile(filePath, JSON.stringify(painPoints, null, 2));

    return NextResponse.json({ 
      message: 'Scraping completed successfully', 
      count: painPoints.length 
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
