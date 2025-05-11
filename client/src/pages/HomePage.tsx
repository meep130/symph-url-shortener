import React, { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [slugError, setSlugError] = useState('');

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  const handleSubmit = async () => {
    setLoading(true);
    setUrlError('');
    setSlugError('');
    setShortUrl('');

    if (!url || !isValidUrl(url)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com )');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: url,
          slug: customSlug || undefined,
          expires_at: expiresAt || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          error: 'Server returned an unexpected response'
        }));

        if (errorData.error === 'Invalid URL') {
          setUrlError('Please enter a valid URL');
        } else if (errorData.error === 'Slug already taken') {
          setSlugError('This slug is already used – try another one');
        } else {
          alert(errorData.error || 'Something went wrong');
        }

        setLoading(false);
        return;
      }

      const data = await res.json();
      setShortUrl(data.short_url);
    } catch (err) {
      console.error('Fetch failed:', err.message);
      alert('Network error – could not reach server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Symph URL Shortener</h1>

        {/* Long URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Enter long URL</label>
          <input
            placeholder="https://example.com "
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlError('');
            }}
            className={`w-full border p-3 rounded-md focus:outline-none ${
              urlError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
          />
          {urlError && <p className="mt-1 text-sm text-red-600">{urlError}</p>}
        </div>

        {/* Custom Slug Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Custom slug (optional)</label>
          <input
            placeholder="your-slug"
            value={customSlug}
            onChange={(e) => {
              setCustomSlug(e.target.value);
              setSlugError('');
            }}
            className={`w-full border p-3 rounded-md focus:outline-none ${
              slugError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
          />
          {slugError && <p className="mt-1 text-sm text-red-600">{slugError}</p>}
        </div>

        {/* Expiration Date Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">Expiration date (optional)</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <small className="text-gray-500 mt-1 block">Leave empty for no expiration</small>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-all duration-200 ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="text-blue-300"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0H4z" className="text-white"></path>
              </svg>
              Shortening...
            </span>
          ) : (
            'Shorten URL'
          )}
        </button>

        {/* Display Shortened URL */}
        {shortUrl && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="break-all text-blue-900 font-medium">
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {shortUrl}
              </a>
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(shortUrl)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition"
            >
              📋 Copy to clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}