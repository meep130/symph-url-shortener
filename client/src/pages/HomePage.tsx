import React, { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [slugError, setSlugError] = useState('');
  const [isUtmOpen, setIsUtmOpen] = useState(false);

  // Track individual UTM fields
  const [utmParams, setUtmParams] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: ''
  });



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
      const utmFields = {
        ...(utmParams.utm_source && { utm_source: utmParams.utm_source }),
        ...(utmParams.utm_medium && { utm_medium: utmParams.utm_medium }),
        ...(utmParams.utm_campaign && { utm_campaign: utmParams.utm_campaign }),
        ...(utmParams.utm_term && { utm_term: utmParams.utm_term }),
        ...(utmParams.utm_content && { utm_content: utmParams.utm_content })
      };

      const body: any = {
        original_url: url,
        slug: customSlug || undefined,
        expires_at: expiresAt || undefined
      };

      // Only include utm_params if at least one UTM field is present
      if (Object.keys(utmFields).length > 0) {
        body.utm_params = utmFields;
      }

      const res = await fetch('http://localhost:8000/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

      // Optional: Show success animation or toast
      const inputFields = document.querySelectorAll('input');
      inputFields.forEach((el) => el.blur());

      setUtmParams({
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: ''
      });
      setIsUtmOpen(false);

    } catch (err) {
      console.error('Fetch failed:', err.message);
      alert('Network error – could not reach server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm shadow-xl rounded-xl p-6 border border-gray-200 transition-all duration-300 transform hover:scale-[1.01]">

        {/* Header */}
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 tracking-tight">Symph URL Shortener</h1>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Long URL Input */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Enter long URL</label>
            <input
              placeholder="https://example.com "
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError('');
              }}
              className={`w-full border p-3 rounded-md focus:outline-none ${urlError
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
            />
            {urlError && <p className="mt-1 text-sm text-red-600">{urlError}</p>}
          </div>

          {/* Custom Slug Input */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Custom slug (optional)</label>
            <input
              placeholder="your-slug"
              value={customSlug}
              onChange={(e) => {
                setCustomSlug(e.target.value);
                setSlugError('');
              }}
              className={`w-full border p-3 rounded-md focus:outline-none ${slugError
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
            />
            {slugError && <p className="mt-1 text-sm text-red-600">{slugError}</p>}
          </div>

          {/* Expiration Date Input */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Expiration date (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <small className="text-gray-500 mt-1 block">Leave empty for no expiration</small>
          </div>
        </div>

        {/* Toggle UTM Section */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsUtmOpen(!isUtmOpen)}
            className="text-sm text-blue-600 hover:text-blue-800 transition font-medium flex items-center"
          >
            {isUtmOpen ? 'Hide' : 'Add'} UTM Parameters
            <svg
              className={`ml-1 w-4 h-4 transition-transform ${isUtmOpen ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
            </svg>
          </button>

          {/* Collapsible UTM Fields */}
          <div className={`mt-3 overflow-hidden transition-all duration-300 ${isUtmOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-dashed border-gray-300">
              <div>
                <label className="block text-xs font-medium text-gray-600">utm_source</label>
                <input
                  placeholder="e.g., google"
                  value={utmParams.utm_source}
                  onChange={(e) =>
                    setUtmParams({ ...utmParams, utm_source: e.target.value })
                  }
                  className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">utm_medium</label>
                <input
                  placeholder="e.g., cpc"
                  value={utmParams.utm_medium}
                  onChange={(e) =>
                    setUtmParams({ ...utmParams, utm_medium: e.target.value })
                  }
                  className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">utm_campaign</label>
                <input
                  placeholder="e.g., spring_sale"
                  value={utmParams.utm_campaign}
                  onChange={(e) =>
                    setUtmParams({ ...utmParams, utm_campaign: e.target.value })
                  }
                  className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">utm_term (optional)</label>
                <input
                  placeholder="e.g., shoes"
                  value={utmParams.utm_term}
                  onChange={(e) =>
                    setUtmParams({ ...utmParams, utm_term: e.target.value || undefined })
                  }
                  className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">utm_content (optional)</label>
                <input
                  placeholder="e.g., banner_ad"
                  value={utmParams.utm_content}
                  onChange={(e) =>
                    setUtmParams({ ...utmParams, utm_content: e.target.value || undefined })
                  }
                  className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full mt-6 py-3 px-4 rounded-md text-white font-semibold transition-all duration-200 ${loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0H4z"></path>
              </svg>
              Shortening...
            </span>
          ) : (
            'Shorten URL'
          )}
        </button>

        {/* Display Shortened URL */}
        {shortUrl && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md animate-fadeIn">
            <p className="break-all text-blue-900 font-medium">
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {shortUrl}
              </a>
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(shortUrl)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition inline-flex items-center"
            >
              📋 Copy to clipboard
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Powered by Symph & Vite + Express + Redis + PostgreSQL
        </div>
      </div>
    </div>
  );
}