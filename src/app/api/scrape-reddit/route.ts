
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
  const mockPostsPool = [
    {
      title: "Frustrated with customer support software that doesn't work",
      text: "I run a small business and the customer support platform we use is terrible. It crashes constantly and loses chat history. Customers get frustrated and we look unprofessional. Wish there was something more reliable.",
      url: "https://www.reddit.com/r/entrepreneur/comments/1abc123/frustrated_with_customer_support_software/",
      subreddit: "entrepreneur",
      score: 45,
      date: new Date('2024-03-15').toISOString()
    },
    {
      title: "Need a better project management tool for small teams",
      text: "All the existing project management apps are either too complex or too simple. I need something that works for a team of 5-10 people without being overwhelming. Current tools are disappointing.",
      url: "https://www.reddit.com/r/smallbusiness/comments/1def456/need_better_project_management_tool/",
      subreddit: "smallbusiness",
      score: 32,
      date: new Date('2024-04-22').toISOString()
    },
    {
      title: "Problem with payment processing fees killing margins",
      text: "These payment processors are killing small businesses with their fees. 3.5% plus transaction fees add up quickly when you're trying to bootstrap a startup. Looking for alternatives but can't find any good ones.",
      url: "https://www.reddit.com/r/startups/comments/1ghi789/problem_with_payment_processing_fees/",
      subreddit: "startups",
      score: 67,
      date: new Date('2024-02-10').toISOString()
    },
    {
      title: "Bad experience with website builders - all have major limitations",
      text: "Tried 5 different website builders and they all have major limitations. Either the templates look generic or the customization options are locked behind expensive plans. Hate it when tools promise flexibility but don't deliver.",
      url: "https://www.reddit.com/r/entrepreneur/comments/1jkl012/bad_experience_with_website_builders/",
      subreddit: "entrepreneur",
      score: 28,
      date: new Date('2024-01-05').toISOString()
    },
    {
      title: "SaaS pricing is getting out of hand",
      text: "Every SaaS tool I need for my business keeps raising prices. Subscription fatigue is real. Need something more affordable that doesn't compromise on features. Current solutions are too expensive for small businesses.",
      url: "https://www.reddit.com/r/saas/comments/1mno345/saas_pricing_is_getting_out_of_hand/",
      subreddit: "saas",
      score: 89,
      date: new Date('2024-05-18').toISOString()
    },
    {
      title: "Analytics dashboard tools are either too simple or too complex",
      text: "Looking for a middle ground in analytics tools. Google Analytics is overwhelming, but simple tools don't give enough insights. Frustrated with the lack of options for small to medium businesses.",
      url: "https://www.reddit.com/r/marketing/comments/1pqr678/analytics_dashboard_tools_middle_ground/",
      subreddit: "marketing",
      score: 41,
      date: new Date('2024-06-30').toISOString()
    },
    {
      title: "Inventory management software is a nightmare for small retailers",
      text: "Been trying different inventory management systems for my small retail store. They're either too expensive or missing key features. Need something that handles both online and in-store inventory without breaking the bank.",
      url: "https://www.reddit.com/r/smallbusiness/comments/1stu901/inventory_management_software_nightmare/",
      subreddit: "smallbusiness",
      score: 56,
      date: new Date('2024-07-12').toISOString()
    },
    {
      title: "Email marketing platforms are overpriced for what they offer",
      text: "Frustrated with email marketing costs. Paying $200/month for basic features that should be standard. The pricing tiers don't make sense for growing businesses. Looking for better alternatives.",
      url: "https://www.reddit.com/r/marketing/comments/1vwx234/email_marketing_platforms_overpriced/",
      subreddit: "marketing",
      score: 73,
      date: new Date('2024-08-25').toISOString()
    },
    {
      title: "Terrible experience with cloud storage for business files",
      text: "Our business cloud storage keeps having sync issues. Files get corrupted or don't sync properly between team members. It's causing major workflow problems. Need something more reliable.",
      url: "https://www.reddit.com/r/entrepreneur/comments/1yza567/terrible_cloud_storage_experience/",
      subreddit: "entrepreneur",
      score: 39,
      date: new Date('2024-09-14').toISOString()
    },
    {
      title: "Accounting software UX is stuck in the 90s",
      text: "Why is accounting software so difficult to use? The interfaces are confusing and workflows are unnecessarily complex. Small business owners shouldn't need an accounting degree to manage their books.",
      url: "https://www.reddit.com/r/smallbusiness/comments/1bcd890/accounting_software_ux_problems/",
      subreddit: "smallbusiness",
      score: 64,
      date: new Date('2024-10-03').toISOString()
    },
    {
      title: "Social media scheduling tools lack proper analytics",
      text: "All the social media schedulers I've tried have terrible analytics. They show basic metrics but nothing actionable. Need something that actually helps optimize content strategy, not just post it.",
      url: "https://www.reddit.com/r/marketing/comments/1efg123/social_media_scheduling_analytics/",
      subreddit: "marketing",
      score: 47,
      date: new Date('2024-11-18').toISOString()
    },
    {
      title: "CRM systems are too complex for small teams",
      text: "Tried implementing a CRM for our 8-person team. The setup is overwhelming and the learning curve is steep. We just need something simple to track leads and customers without all the enterprise bloat.",
      url: "https://www.reddit.com/r/startups/comments/1hij456/crm_systems_too_complex_small_teams/",
      subreddit: "startups",
      score: 52,
      date: new Date('2024-12-05').toISOString()
    },
    {
      title: "E-commerce platform fees are eating into profits",
      text: "Between transaction fees, monthly subscriptions, and app costs, e-commerce platforms are taking a huge chunk of revenue. Small sellers are getting squeezed. Need more affordable options.",
      url: "https://www.reddit.com/r/entrepreneur/comments/1klm789/ecommerce_platform_fees_profits/",
      subreddit: "entrepreneur",
      score: 88,
      date: new Date('2025-01-08').toISOString()
    },
    {
      title: "Time tracking software lacks team collaboration features",
      text: "Our time tracking tool works fine for individual tracking but terrible for team projects. Can't see who's working on what in real-time. Need better collaboration features built-in.",
      url: "https://www.reddit.com/r/saas/comments/1nop012/time_tracking_collaboration_issues/",
      subreddit: "saas",
      score: 35,
      date: new Date('2025-01-15').toISOString()
    },
    {
      title: "Customer feedback tools don't integrate well with existing systems",
      text: "Trying to collect customer feedback but every tool I find requires separate logins and doesn't integrate with our current workflow. Data silos are killing our ability to act on feedback quickly.",
      url: "https://www.reddit.com/r/startups/comments/1qrs345/customer_feedback_integration_problems/",
      subreddit: "startups",
      score: 41,
      date: new Date('2025-02-02').toISOString()
    }
  ];

  // Randomly select and shuffle posts each time
  const shuffledPosts = [...mockPostsPool].sort(() => Math.random() - 0.5);
  const selectedPosts = shuffledPosts.slice(0, Math.min(12, shuffledPosts.length));

  // Filter posts from specified year onwards and process them
  const cutoffDate = new Date(`${sinceYear}-01-01`);
  
  return selectedPosts
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
