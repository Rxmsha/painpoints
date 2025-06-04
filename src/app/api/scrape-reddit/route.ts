
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Business-related keywords for filtering
const BUSINESS_KEYWORDS = [
  'product', 'service', 'company', 'app', 'software', 'store', 'feature',
  'customer support', 'subscription', 'update', 'bug', 'price', 'website',
  'platform', 'tool', 'business', 'startup', 'entrepreneur', 'market',
  'customer', 'user experience', 'interface', 'payment', 'billing', 'api',
  'dashboard', 'analytics', 'crm', 'automation', 'saas'
];

// Category mappings based on keywords
const CATEGORY_KEYWORDS = {
  'Technology': ['software', 'app', 'api', 'bug', 'platform', 'tool', 'dashboard', 'automation'],
  'E-commerce': ['store', 'payment', 'billing', 'shipping', 'checkout', 'product', 'marketplace'],
  'Customer Service': ['customer support', 'service', 'help', 'support', 'response', 'chat'],
  'SaaS': ['saas', 'subscription', 'pricing', 'plan', 'feature', 'upgrade'],
  'Marketing': ['marketing', 'analytics', 'campaign', 'social media', 'advertising'],
  'General Business': ['business', 'startup', 'entrepreneur', 'market', 'competition']
};

// Enhanced sentiment analysis with more sophisticated scoring
function analyzeSentiment(text: string): number {
  const strongNegative = ['terrible', 'awful', 'horrible', 'disgusting', 'hate', 'worst', 'useless', 'garbage'];
  const moderateNegative = ['bad', 'poor', 'disappointing', 'frustrated', 'annoyed', 'broken', 'difficult'];
  const mildNegative = ['okay', 'meh', 'could be better', 'not great', 'lacking'];
  const positive = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic'];
  const strongPositive = ['incredible', 'outstanding', 'phenomenal', 'exceptional', 'brilliant'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (strongPositive.includes(word)) score += 2;
    else if (positive.includes(word)) score += 1;
    else if (mildNegative.includes(word)) score -= 0.5;
    else if (moderateNegative.includes(word)) score -= 1;
    else if (strongNegative.includes(word)) score -= 2;
  });
  
  // Additional context scoring for pain point indicators
  const painIndicators = [
    'wish there was', 'need something that', 'looking for', 'cant find',
    'doesnt exist', 'why isnt there', 'someone should make'
  ];
  
  painIndicators.forEach(indicator => {
    if (text.toLowerCase().includes(indicator)) {
      score -= 1; // These indicate unmet needs/pain points
    }
  });
  
  // Normalize score
  return Math.max(-1, Math.min(1, score / Math.max(words.length / 15, 1)));
}

// Determine category based on content
function categorizeContent(text: string): string {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let bestCategory = 'General Business';
  
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    const score = keywords.reduce((sum, keyword) => {
      return sum + (lowerText.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  });
  
  return bestCategory;
}

// Check if text contains business-related keywords
function containsBusinessKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  return BUSINESS_KEYWORDS.filter(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Check if text indicates a business pain point or unmet need
function isBusinessPainPoint(text: string, sentimentScore: number): boolean {
  // Must have negative sentiment
  if (sentimentScore >= -0.1) return false;
  
  // Must contain business keywords
  const businessKeywords = containsBusinessKeywords(text);
  if (businessKeywords.length === 0) return false;
  
  // Additional pain point indicators
  const painPointIndicators = [
    'frustrated', 'annoyed', 'disappointed', 'terrible', 'awful', 'broken',
    'doesnt work', 'wish there was', 'need something', 'looking for',
    'cant find', 'problem with', 'issue with', 'hate it when'
  ];
  
  const lowerText = text.toLowerCase();
  const hasPainIndicator = painPointIndicators.some(indicator => 
    lowerText.includes(indicator)
  );
  
  return hasPainIndicator;
}

// Generate mock Reddit data with configurable cutoff year
function generateMockRedditData(subreddits: string[], keywords: string[], sinceYear: number = 2024) {
  const mockPosts = [
    {
      title: "Frustrated with customer support software that doesn't work",
      text: "I run a small business and the customer support platform we use is terrible. It crashes constantly and loses chat history. Customers get frustrated and we look unprofessional. Wish there was something more reliable.",
      url: "https://reddit.com/r/entrepreneur/mock1",
      subreddit: "entrepreneur",
      score: 45,
      date: new Date('2024-03-15').toISOString()
    },
    {
      title: "Need a better project management tool for small teams",
      text: "All the existing project management apps are either too complex or too simple. I need something that works for a team of 5-10 people without being overwhelming. Current tools are disappointing.",
      url: "https://reddit.com/r/smallbusiness/mock2",
      subreddit: "smallbusiness",
      score: 32,
      date: new Date('2024-04-22').toISOString()
    },
    {
      title: "Problem with payment processing fees killing margins",
      text: "These payment processors are killing small businesses with their fees. 3.5% plus transaction fees add up quickly when you're trying to bootstrap a startup. Looking for alternatives but can't find any good ones.",
      url: "https://reddit.com/r/startups/mock3",
      subreddit: "startups",
      score: 67,
      date: new Date('2024-02-10').toISOString()
    },
    {
      title: "Bad experience with website builders - all have major limitations",
      text: "Tried 5 different website builders and they all have major limitations. Either the templates look generic or the customization options are locked behind expensive plans. Hate it when tools promise flexibility but don't deliver.",
      url: "https://reddit.com/r/entrepreneur/mock4",
      subreddit: "entrepreneur",
      score: 28,
      date: new Date('2024-01-05').toISOString()
    },
    {
      title: "SaaS pricing is getting out of hand",
      text: "Every SaaS tool I need for my business keeps raising prices. Subscription fatigue is real. Need something more affordable that doesn't compromise on features. Current solutions are too expensive for small businesses.",
      url: "https://reddit.com/r/saas/mock5",
      subreddit: "saas",
      score: 89,
      date: new Date('2024-05-18').toISOString()
    },
    {
      title: "Analytics dashboard tools are either too simple or too complex",
      text: "Looking for a middle ground in analytics tools. Google Analytics is overwhelming, but simple tools don't give enough insights. Frustrated with the lack of options for small to medium businesses.",
      url: "https://reddit.com/r/marketing/mock6",
      subreddit: "marketing",
      score: 41,
      date: new Date('2024-06-30').toISOString()
    }
  ];

  // Filter posts from specified year onwards and process them
  const cutoffDate = new Date(`${sinceYear}-01-01`);
  
  return mockPosts
    .filter(post => new Date(post.date) >= cutoffDate)
    .map(post => {
      const sentimentScore = analyzeSentiment(post.title + ' ' + post.text);
      const businessKeywords = containsBusinessKeywords(post.title + ' ' + post.text);
      const category = categorizeContent(post.title + ' ' + post.text);
      
      // Only return if it's a valid business pain point
      if (isBusinessPainPoint(post.title + ' ' + post.text, sentimentScore)) {
        return {
          id: Math.random().toString(36).substr(2, 9),
          text: post.text,
          title: post.title,
          sentiment_score: sentimentScore,
          business_keywords: businessKeywords,
          category: category,
          url: post.url,
          date: post.date,
          source: `r/${post.subreddit}`,
          score: post.score,
          is_liked: null,
          is_unliked: null
        };
      }
      return null;
    })
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const { subreddits, keywords, since_year } = await request.json();
    
    if (!subreddits || !Array.isArray(subreddits) || subreddits.length === 0) {
      return NextResponse.json({ error: 'Subreddits are required' }, { status: 400 });
    }

    // Generate mock data (in production, this would use PRAW)
    const painPoints = generateMockRedditData(subreddits, keywords || [], since_year || 2024);
    
    // Save to JSON file (simulate database)
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'pain_points.json');
    
    // Read existing data
    let existingData = [];
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      existingData = JSON.parse(existingContent);
    } catch (error) {
      existingData = [];
    }
    
    // Add new data (avoid duplicates)
    const existingUrls = new Set(existingData.map((item: any) => item.url));
    const newPainPoints = painPoints.filter(point => !existingUrls.has(point.url));
    
    const updatedData = [...existingData, ...newPainPoints];
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ 
      message: 'Pain points discovered and saved successfully',
      found: newPainPoints.length,
      total: updatedData.length
    });
    
  } catch (error) {
    console.error('Error in scrape-reddit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
