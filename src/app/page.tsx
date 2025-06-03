
'use client';

import { useState } from 'react';
import Image from "next/image";

interface PainPoint {
  id: string;
  text: string;
  sentiment_score: number;
  business_keywords: string[];
  url: string;
  date: string;
  source: string;
}

export default function Home() {
  const [subreddits, setSubreddits] = useState('');
  const [keywords, setKeywords] = useState('');
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

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
        alert('Scraping completed! Click "Load Pain Points" to see results.');
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
      const response = await fetch('/api/pain-points');
      const data = await response.json();
      setPainPoints(data);
    } catch (error) {
      alert('Error loading pain points: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={25}
            priority
          />
          <h1 className="text-3xl font-bold">Pain Point Identifier</h1>
        </div>

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
                placeholder="entrepreneur, startups, smallbusiness"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="frustrated with, annoyed by, wish there was, problem with"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
            
            <button
              onClick={handleScrape}
              disabled={scraping || !subreddits || !keywords}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-medium"
            >
              {scraping ? 'Scraping...' : 'Start Scraping'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pain Points</h2>
            <button
              onClick={loadPainPoints}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              {loading ? 'Loading...' : 'Load Pain Points'}
            </button>
          </div>
          
          <div className="space-y-4">
            {painPoints.length === 0 ? (
              <p className="text-gray-500">No pain points loaded yet. Use the scraper above to collect data.</p>
            ) : (
              painPoints.map((point) => (
                <div key={point.id} className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">{point.source}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      point.sentiment_score < -0.5 ? 'bg-red-100 text-red-800' :
                      point.sentiment_score < 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Sentiment: {point.sentiment_score.toFixed(2)}
                    </span>
                  </div>
                  <p className="mb-2">{point.text}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {point.business_keywords.map((keyword, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <a 
                    href={point.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    View Original Post
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
