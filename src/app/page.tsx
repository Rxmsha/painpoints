
'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";

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
  const [subreddits, setSubreddits] = useState('');
  const [keywords, setKeywords] = useState('');
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  
  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [likedFilter, setLikedFilter] = useState<string>('all'); // 'all', 'liked', 'unliked'
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
    loadPainPoints();
  }, []);

  useEffect(() => {
    loadPainPoints();
  }, [currentPage, selectedCategory, likedFilter, sortBy, sortOrder]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
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
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        }),
      });
      
      const result = await response.json();
      if (response.ok) {
        alert(`Scraping completed! Found ${result.found} new pain points. Total: ${result.total}`);
        loadPainPoints();
      } else {
        alert('Scraping failed: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error);
    } finally {
      setScraping(false);
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
      
      if (likedFilter === 'liked') {
        params.append('liked', 'true');
      } else if (likedFilter === 'unliked') {
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

  const renderPagination = () => {
    if (!pagination) return null;
    
    return (
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={!pagination.hasPrev}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        
        <span className="text-sm text-gray-600">
          Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
        </span>
        
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={!pagination.hasNext}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={25}
            priority
          />
          <h1 className="text-3xl font-bold">Enhanced Pain Point Identifier</h1>
        </div>

        {/* Scraping Configuration */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Reddit Scraping Configuration</h2>
          
          <div className="space-y-4">
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
                Additional Keywords (optional - AI will auto-detect pain points)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Optional: specific terms to look for"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
            
            <button
              onClick={handleScrape}
              disabled={scraping || !subreddits}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-semibold w-full"
            >
              {scraping ? 'Discovering Pain Points...' : 'Discover Pain Points (2024+)'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters & Sorting</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={likedFilter}
                onChange={(e) => {
                  setLikedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="all">All Items</option>
                <option value="liked">Liked Only</option>
                <option value="unliked">Disliked Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="date">Date</option>
                <option value="sentiment">Sentiment</option>
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
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pain Points Display */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Pain Points</h2>
            <button
              onClick={loadPainPoints}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          <div className="space-y-6">
            {painPoints.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No pain points found. Use the scraper above to collect data.
              </p>
            ) : (
              painPoints.map((point) => (
                <div key={point.id} className="border border-gray-300 dark:border-gray-600 p-6 rounded-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{point.source}</span>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        point.sentiment_score < -0.5 ? 'bg-red-100 text-red-800' :
                        point.sentiment_score < 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        Sentiment: {point.sentiment_score.toFixed(2)}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded font-medium">
                        {point.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLike(point.id, point.is_liked ? 'clear' : 'like')}
                        className={`p-2 rounded ${
                          point.is_liked 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 hover:bg-green-200 text-gray-700'
                        }`}
                        title={point.is_liked ? 'Remove like' : 'Like this pain point'}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleLike(point.id, point.is_unliked ? 'clear' : 'unlike')}
                        className={`p-2 rounded ${
                          point.is_unliked 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-200 hover:bg-red-200 text-gray-700'
                        }`}
                        title={point.is_unliked ? 'Remove dislike' : 'Dislike this pain point'}
                      >
                        👎
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{point.title}</h3>
                  <p className="mb-3 text-gray-700 dark:text-gray-300">{point.text}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {point.business_keywords.map((keyword, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Score: {point.score} | {new Date(point.date).toLocaleDateString()}</span>
                    <a 
                      href={point.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View Original Post →
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {renderPagination()}
        </div>
      </main>
    </div>
  );
}
