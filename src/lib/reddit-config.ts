
// Reddit API Configuration
// To use real Reddit data, you'll need to:
// 1. Create a Reddit app at https://www.reddit.com/prefs/apps
// 2. Add your credentials to environment variables in Replit Secrets
// 3. Install reddit API client: npm install snoowrap

export const REDDIT_CONFIG = {
  // These should come from environment variables in production
  clientId: process.env.REDDIT_CLIENT_ID || '',
  clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
  userAgent: process.env.REDDIT_USER_AGENT || 'PainPointIdentifier/1.0.0',
  
  // Rate limiting settings
  requestDelay: 1000, // 1 second between requests
  maxRequestsPerMinute: 60,
  
  // Default subreddits for business pain points
  defaultSubreddits: [
    'entrepreneur',
    'smallbusiness', 
    'startups',
    'SaaS',
    'webdev',
    'marketing',
    'ecommerce'
  ],
  
  // Default pain point keywords
  defaultKeywords: [
    'frustrated with',
    'annoyed by', 
    'wish there was',
    'problem with',
    'hate it when',
    'bad experience',
    'terrible experience',
    'disappointed with'
  ]
};

// Business-related keywords for filtering relevant posts
export const BUSINESS_KEYWORDS = [
  'product', 'service', 'company', 'app', 'software', 'store', 'feature',
  'customer support', 'subscription', 'update', 'bug', 'price', 'website',
  'platform', 'tool', 'business', 'startup', 'entrepreneur', 'market',
  'customer', 'user experience', 'interface', 'payment', 'billing',
  'saas', 'api', 'dashboard', 'analytics', 'crm', 'automation'
];
