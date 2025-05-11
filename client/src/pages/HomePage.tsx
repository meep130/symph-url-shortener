import React, { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_url: url, slug: customSlug || undefined }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error:', res.status, errorText);
        alert('Error shortening URL. Check console.');
        return;
      }

      const data = await res.json();
      setShortUrl(data.short_url);
    } catch (err) {
      console.error('Fetch failed:', err);
      alert('Network error – could not reach API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Symph URL Shortener</h1>
      <input
        placeholder="Enter long URLs"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border p-2 mb-2"
      />
      <input
        placeholder="Custom slug (optional)"
        value={customSlug}
        onChange={(e) => setCustomSlug(e.target.value)}
        className="w-full border p-2 mb-2"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {loading ? 'Shortening...' : 'Shorten'}
      </button>

      {shortUrl && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="break-all">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {shortUrl}
            </a>
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(shortUrl)}
            className="text-sm text-gray-600 underline mt-2"
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}