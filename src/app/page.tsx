
'use client';

import { useState, useEffect } from 'react';

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

interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function Home() {
  const [subreddits, setSubreddits] = useState('entrepreneur,startups,smallbusiness,saas');
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  
  // Filters and Navigation
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentView, setCurrentView] = useState<'all' | 'liked' | 'unliked'>('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [categories, setCategories] = useState<string[]>([]);
  const [fetchSinceYear, setFetchSinceYear] = useState('2024');

  useEffect(() => {
    loadCategories();
    loadPainPoints();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedCategory, currentView, sortBy, sortOrder]);

  useEffect(() => {
    loadPainPoints();
  }, [currentPage, selectedCategory, currentView, sortBy, sortOrder]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPainPoints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy,
        sortOrder,
      });
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      if (currentView === 'liked') {
        params.append('liked', 'true');
      } else if (currentView === 'unliked') {
        params.append('liked', 'false');
      }
      
      const response = await fetch(`/api/pain-points?${params}`);
      const result = await response.json();
      
      setPainPoints(result.data);
      setPagination(result.pagination);
    } catch (error) {
      alert('Error loading pain points: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      const response = await fetch('/api/scrape-reddit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subreddits: subreddits.split(',').map(s => s.trim()).filter(s => s),
          since_year: parseInt(fetchSinceYear),
        }),
      });
      
      const result = await response.json();
      if (response.ok) {
        alert(`Scraping completed! Found ${result.found} new pain points. Total: ${result.total}`);
        loadPainPoints();
        loadCategories(); // Refresh categories in case new ones were discovered
      } else {
        alert('Scraping failed: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error);
    } finally {
      setScraping(false);
    }
  };

  const handleLike = async (id: string, action: 'like' | 'unlike' | 'clear') => {
    try {
      const response = await fetch('/api/pain-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, id }),
      });
      
      if (response.ok) {
        loadPainPoints();
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Error: ' + error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSentimentColor = (score: number) => {
    if (score < -0.5) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (score < 0) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8">
          Business Pain Point Identifier
        </h1>
        
        {/* Scraping Configuration */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Reddit Data Collection</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subreddits (comma-separated)
                </label>
                <input
                  type="text"
                  value={subreddits}
                  onChange={(e) => setSubreddits(e.target.value)}
                  placeholder="entrepreneur, startups, smallbusiness, saas"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fetch posts since year
                </label>
                <select
                  value={fetchSinceYear}
                  onChange={(e) => setFetchSinceYear(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleScrape}
              disabled={scraping || !subreddits}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-semibold w-full"
            >
              {scraping ? 'Discovering Pain Points...' : 'Discover Business Pain Points'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setCurrentView('all')}
              className={`px-4 py-2 rounded-md font-medium ${
                currentView === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All Pain Points
            </button>
            <button
              onClick={() => setCurrentView('liked')}
              className={`px-4 py-2 rounded-md font-medium ${
                currentView === 'liked'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              👍 Liked Items
            </button>
            <button
              onClick={() => setCurrentView('unliked')}
              className={`px-4 py-2 rounded-md font-medium ${
                currentView === 'unliked'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              👎 Unliked Items
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="date">Date</option>
                <option value="sentiment">Sentiment Score</option>
                <option value="score">Reddit Score</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          <button
            onClick={loadPainPoints}
            disabled={loading}
            className="mt-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
          >
            {loading ? 'Loading...' : 'Refresh Results'}
          </button>
        </div>

        {/* Pain Points Display */}
        <div className="space-y-6">
          {painPoints.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
              <p className="text-gray-500 mb-4">
                {currentView === 'all' 
                  ? 'No pain points found. Use the scraper above to collect data.'
                  : `No ${currentView} items found.`
                }
              </p>
            </div>
          ) : (
            painPoints.map((point) => (
              <div key={point.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-500">{point.source}</span>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${getSentimentColor(point.sentiment_score)}`}>
                      Sentiment: {point.sentiment_score.toFixed(2)}
                    </span>
                    <span className="px-2 py-1 text-xs rounded font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {point.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      Score: {point.score}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(point.date)}</span>
                </div>
                
                {point.title && (
                  <h3 className="font-semibold text-lg mb-2">{point.title}</h3>
                )}
                
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {point.text}
                </p>
                
                {point.business_keywords.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                      Business keywords:
                    </span>
                    <div className="inline-flex flex-wrap gap-1">
                      {point.business_keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLike(point.id, point.is_liked ? 'clear' : 'like')}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
                        point.is_liked
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      👍 {point.is_liked ? 'Liked' : 'Like'}
                    </button>
                    <button
                      onClick={() => handleLike(point.id, point.is_unliked ? 'clear' : 'unlike')}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
                        point.is_unliked
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      👎 {point.is_unliked ? 'Unliked' : 'Unlike'}
                    </button>
                  </div>
                  
                  <a
                    href={point.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    View Original Post →
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.totalItems} total items)
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={!pagination.hasNext}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
