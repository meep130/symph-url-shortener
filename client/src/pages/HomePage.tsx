import React, { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: url,
          slug: customSlug || undefined,
          expires_at: expiresAt || undefined
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error:', res.status, errorText);
        alert('Error shortening URL. See console.');
        return;
      }

      const data = await res.json();
      setShortUrl(data.short_url);
    } catch (err) {
      console.error('Fetch failed:', err);
      alert('Network error – could not reach server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center">Symph URL Shortener</h1>

      {/* Long URL Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Enter long URL <span className="text-red-500">*</span>
        </label>
        <input
          placeholder="https://example.com "
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <small className="text-gray-500 mt-1 block">This is the URL you want to shorten</small>
      </div>

      {/* Custom Slug Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Custom slug (optional)
        </label>
        <input
          placeholder="your-custom-slug"
          value={customSlug}
          onChange={(e) => setCustomSlug(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <small className="text-gray-500 mt-1 block">Leave blank for auto-generated slug</small>
      </div>

      {/* Expiration Date Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          Expiration date (optional)
        </label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <small className="text-gray-500 mt-1 block">Leave empty for no expiration</small>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded ${
          loading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Shortening...' : 'Shorten'}
      </button>

      {/* Display Shortened URL */}
      {shortUrl && (
        <div className="mt-6 p-4 bg-gray-100 rounded shadow-sm">
          <p className="break-all">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {shortUrl}
            </a>
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(shortUrl)}
            className="text-sm text-gray-600 underline mt-2 hover:text-gray-900 transition"
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}